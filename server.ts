import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";
  // The port MUST strictly be 3000 as mandated by the container reverse proxy infrastructure
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoints for Cloud Run startup/liveness/readiness probes
  const sendHealthOk = (_req: express.Request, res: express.Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  };

  app.get("/api/health", sendHealthOk);
  app.get("/healthz", sendHealthOk);
  app.get("/health", sendHealthOk);
  app.get("/ping", (_req, res) => res.status(200).send("pong"));

  if (!isProd) {
    // Dynamically load Vite in development mode to avoid bundling heavy build tooling in production
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Resolve dist folder whether run from project root or inside dist
    const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : __dirname;

    // Serve static assets
    app.use(express.static(distPath, { maxAge: "1d" }));

    // Never return index.html for missing static files (prevents syntax errors in browsers)
    app.use("/assets", (_req, res) => {
      res.status(404).send("Not Found");
    });

    // SPA fallback: return index.html for all other GET requests
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (env: ${isProd ? "production" : "development"})`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("Shutting down HTTP server...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// Global safety net for unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

