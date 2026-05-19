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
      const model = images && images.length > 0 ? "llama-3.2-90b-vision-preview" : (requestedModel || "llama-3.3-70b-versatile");

      if (action === "chat") {
        response = await groq.chat.completions.create({
          model,
          messages: messages || [],
          temperature: 0.7,
          max_completion_tokens: 4096,
          top_p: 1,
          stream: false,
        });
      } else if (action === "vision") {
        // Handle images in vision model
        const content = [
          { type: "text", text: prompt },
          ...images.map((img: any) => ({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${img.data}` }
          }))
        ];

        response = await groq.chat.completions.create({
          model: "llama-3.2-90b-vision-preview",
          messages: [{ role: "user", content: content as any }],
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        });
      } else {
        response = await groq.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_completion_tokens: 4096,
          response_format: requestedModel === "json" || action === "json" ? { type: "json_object" } : undefined,
        });
      }

      res.json({ text: stripThinkingTags(response.choices[0].message.content) });
    } catch (error: any) {
      console.error("Groq AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI request" });
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
