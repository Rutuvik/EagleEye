import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));

  // Allowed IPs
  const ALLOWED_IPS = ["183.177.127.146", "203.193.167.99"];

  // IP Restriction Middleware
  app.use((req, res, next) => {
    // Skip IP restriction for local health check or if no IPs defined (though here they are)
    if (req.path === "/api/health") return next();

    const clientIp = (
      req.headers["x-forwarded-for"] || 
      req.socket.remoteAddress || 
      ""
    ).toString().split(",")[0].trim();

    // Allow internal traffic or specific IPs
    if (ALLOWED_IPS.includes(clientIp) || clientIp === "127.0.0.1" || clientIp === "::1" || !process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      next();
    } else {
      console.log(`Blocked access from IP: ${clientIp}`);
      res.status(403).send("Forbidden: Access restricted to office network.");
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai", async (req, res) => {
    const { action, prompt, history, messages, images, model: requestedModel } = req.body;

    try {
      let response;
      const model = images && images.length > 0 ? "llama-3.2-90b-vision-preview" : (requestedModel || "llama-3.3-70b-versatile");

      if (action === "chat") {
        response = await groq.chat.completions.create({
          model,
          messages: messages || [],
          temperature: 0.2,
          max_completion_tokens: 1024,
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
          temperature: 0.2,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        });
      } else {
        response = await groq.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_completion_tokens: 4096,
          response_format: requestedModel === "json" || action === "json" ? { type: "json_object" } : undefined,
        });
      }

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("Groq AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
