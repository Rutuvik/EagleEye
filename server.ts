import express from "express";
import path from "path";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("GROQ_API_KEY is not set. AI features will fail if OpenRouter is not used.");
    }
    groqClient = new Groq({
      apiKey: apiKey || "MISSING_KEY",
    });
  }
  return groqClient;
}

async function callOpenRouter(options: any, model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://ai.studio/build",
      "X-Title": "Deep Listing Optimization Audit Report"
    },
    body: JSON.stringify({
      ...options,
      model: model
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
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

    if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Neither GROQ_API_KEY nor OPENROUTER_API_KEY is configured in environment variables." });
    }

    try {
      let response;
      
      // Smart Routing: default to deepseek-v4-flash (OpenRouter), fall back to llama-3.3-70b-versatile or llama-3.2-90b-vision-preview for vision/images
      let model = "deepseek-v4-flash";
      if (action === "vision" || (images && images.length > 0)) {
        model = "llama-3.2-90b-vision-preview";
      }

      // Safe truncation to handle low TPM/Payload limits on the free tier
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

      // Smart Fallback Runner to handle API failures / Rate Limits dynamically across OpenRouter and Groq providers
      async function executeAiWithFallback(options: any, initialModel: string) {
        const queue: { provider: "openrouter" | "groq"; model: string }[] = [];

        // 1. Populate with OpenRouter if configured
        if (process.env.OPENROUTER_API_KEY) {
          queue.push({ provider: "openrouter", model: initialModel });
          queue.push({ provider: "openrouter", model: "deepseek/deepseek-chat" });
          queue.push({ provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct" });
        }

        // 2. Populate with Groq as reliable backup/fallback
        if (process.env.GROQ_API_KEY) {
          queue.push({ provider: "groq", model: "llama-3.3-70b-versatile" });
          queue.push({ provider: "groq", model: "llama-3.1-8b-instant" });
        }

        // De-duplicate target options
        const uniqueQueue: { provider: "openrouter" | "groq"; model: string }[] = [];
        const seen = new Set<string>();
        for (const item of queue) {
          const key = `${item.provider}:${item.model}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueQueue.push(item);
          }
        }

        let lastError: any = null;
        
        for (const target of uniqueQueue) {
          try {
            console.log(`[AI Routing] Dispatching request using [${target.provider}] model: ${target.model}`);
            let sanitizedOptions = { ...options };
            const isVisionModel = target.model.includes("vision");
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

            if (target.provider === "openrouter") {
              const res = await callOpenRouter(sanitizedOptions, target.model);
              console.log(`[AI Routing] Success with OpenRouter model: ${target.model}`);
              return res;
            } else {
              const groq = getGroq();
              const res = await groq.chat.completions.create({
                ...sanitizedOptions,
                model: target.model
              });
              console.log(`[AI Routing] Success with Groq model: ${target.model}`);
              return res;
            }
          } catch (err: any) {
            console.error(`[AI Routing] Fail with [${target.provider}] model ${target.model}: ${err.message || err}`);
            lastError = err;
          }
        }
        throw lastError;
      }

      if (action === "chat") {
        response = await executeAiWithFallback({
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

        response = await executeAiWithFallback({
          messages: [{ role: "user", content: content as any }],
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        }, model);
      } else {
        response = await executeAiWithFallback({
          messages: finalMessages,
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: requestedModel === "json" || action === "json" ? { type: "json_object" } : undefined,
        }, model);
      }

      const textResponse = response.choices?.[0]?.message?.content || "";
      res.json({ text: stripThinkingTags(textResponse) });
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
