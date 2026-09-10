import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";
  const PORT = isProd ? (Number(process.env.PORT) || 3000) : 3000;

  app.use(express.json());

  // Health check endpoints for Cloud Run startup/liveness probes and monitoring
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).send("OK");
  });

  // Vite middleware for development or static serving for production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Primary listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // In production, if PORT is not 3000, also listen on 3000 as fallback
  if (isProd && PORT !== 3000) {
    try {
      app.listen(3000, "0.0.0.0", () => {
        console.log("Server also listening on fallback port 3000");
      });
    } catch {
      // Ignored if port 3000 is unavailable
    }
  }
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
