import express from "express";
import path from "path";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY is not set. AI features will fail.");
    }
    groqClient = new Groq({
      apiKey: apiKey || "MISSING_KEY",
    });
  }
  return groqClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai", async (req, res) => {
    const { action, prompt, history, messages, images, model: requestedModel } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured in environment variables." });
    }

    try {
      const groq = getGroq();
      let response;
      
      // Smart Routing: default to llama-3.3-70b-versatile, use llama-3.2-90b-vision-preview for vision/images
      let model = "llama-3.3-70b-versatile";
      if (action === "vision" || (images && images.length > 0)) {
        model = "llama-3.2-90b-vision-preview";
      }

      // Safe truncation to handle Groq's low TPM/Payload limits on the free tier
      const maxChars = 24000; // Approx 6000 tokens
      
      let finalMessages = messages || [];
      if (action === "chat") {
        let currentChars = 0;
        const truncated = [];
        for (let i = finalMessages.length - 1; i >= 0; i--) {
          const m = finalMessages[i];
          const len = typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length;
          if (currentChars + len < maxChars) {
            truncated.unshift(m);
            currentChars += len;
          } else {
            break;
          }
        }
        finalMessages = truncated;
      } else if (prompt) {
        const truncatedPrompt = prompt.length > maxChars ? prompt.substring(0, maxChars) + "... [truncated due to length constraints]" : prompt;
        finalMessages = [{ role: "user", content: truncatedPrompt }];
      }

      // Smart Fallback Runner to handle API failures / Rate Limits dynamically
      async function executeGroqWithFallback(options: any, initialModel: string) {
        const fallbackQueue = [
          initialModel,
          "llama-3.1-8b-instant"
        ];
        
        // Remove duplicates and ensure only valid strings are kept
        const uniqueQueue = Array.from(new Set(fallbackQueue.filter(Boolean)));
        let lastError: any = null;
        
        for (const modelToTry of uniqueQueue) {
          try {
            console.log(`[AI Routing] Dispatching request using model: ${modelToTry}`);
            let sanitizedOptions = { ...options };
            const isVisionModel = modelToTry.includes("vision");
            if (!isVisionModel && sanitizedOptions.messages) {
              sanitizedOptions.messages = sanitizedOptions.messages.map((msg: any) => {
                if (Array.isArray(msg.content)) {
                  const textParts = msg.content
                    .filter((part: any) => part.type === "text")
                    .map((part: any) => part.text)
                    .join("\n");
                  return { ...msg, content: textParts };
                }
                return msg;
              });
            }

            const result = await groq.chat.completions.create({
              ...sanitizedOptions,
              model: modelToTry
            });
            console.log(`[AI Routing] Success with model: ${modelToTry}`);
            return result;
          } catch (err: any) {
            console.error(`[AI Routing] Fail with model ${modelToTry}: ${err.message || err}`);
            lastError = err;
          }
        }
        throw lastError;
      }

      if (action === "chat") {
        response = await executeGroqWithFallback({
          messages: finalMessages,
          temperature: 0.7,
          max_completion_tokens: 4096,
          top_p: 1,
          stream: false,
        }, model);
      } else if (action === "vision") {
        // Construct visual message payload with inline image objects
        const content = [
          { type: "text", text: prompt.substring(0, 5000) }
        ];
        if (images && images.length > 0) {
          content.push(...images.slice(0, 4).map((img: any) => ({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.data}` }
          })));
        }

        response = await executeGroqWithFallback({
          messages: [{ role: "user", content: content as any }],
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        }, model);
      } else {
        response = await executeGroqWithFallback({
          messages: finalMessages,
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: requestedModel === "json" || action === "json" ? { type: "json_object" } : undefined,
        }, model);
      }

      res.json({ text: stripThinkingTags(response.choices[0].message.content) });
    } catch (error: any) {
      console.error("Groq AI Error:", error);
      const status = error.status || 500;
      const message = error.message || "Failed to process AI request";
      
      if (status === 413 || (message.includes('rate_limit_exceeded') && message.includes('tokens'))) {
        return res.status(413).json({ 
          error: "The request is too large for the current AI model limit. Please reduce the length of your listing data or keywords and try again." 
        });
      }
      
      res.status(status).json({ error: message });
    }
  });

  // Helper to strip <think> tags from Qwen/Reasoning models
  function stripThinkingTags(text: string | null): string {
    if (!text) return "";
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
