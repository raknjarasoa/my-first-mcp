import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./mcp.js";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// ── Session store ──────────────────────────────────────────────────────────

const transports: Record<string, StreamableHTTPServerTransport> = {};

// ── Middleware ──────────────────────────────────────────────────────────────

// Parse JSON — required by StreamableHTTPServerTransport
app.use(express.json());

// Optional Bearer-token auth when API_KEY is set in .env
if (API_KEY) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized — API Key manquante ou invalide." },
        id: null,
      });
      return;
    }
    next();
  });
}

// ── Health check ───────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    activeSessions: Object.keys(transports).length,
  });
});

// ── MCP Streamable HTTP endpoint ──────────────────────────────────────────

// POST /mcp — handles JSON-RPC messages (initialize + all subsequent calls)
app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // ── Existing session ──
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // ── New session (initialization request) ──
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          console.log(`✅ Session initialisée: ${newSessionId}`);
          transports[newSessionId] = transport;
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`🔌 Session fermée: ${sid}`);
          delete transports[sid];
        }
      };

      // Each session gets its own MCP server instance
      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return; // Already handled
    } else {
      // ── Invalid request ──
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: Session ID invalide ou requête non-initialize.",
        },
        id: null,
      });
      return;
    }

    // Handle request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Erreur lors du traitement de la requête MCP:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Erreur interne du serveur." },
        id: null,
      });
    }
  }
});

// GET /mcp — SSE stream for server-initiated notifications
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Session ID invalide ou manquant." },
      id: null,
    });
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// DELETE /mcp — session termination
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Session ID invalide ou manquant." },
      id: null,
    });
    return;
  }

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Erreur lors de la fermeture de session:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Erreur lors de la fermeture de session." },
        id: null,
      });
    }
  }
});

// ── Fallback (404) ─────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route non trouvée." });
});

// ── Start server ───────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur MCP démarré sur le port ${PORT}`);
  console.log(`🔗 Endpoint MCP :    http://localhost:${PORT}/mcp`);
  console.log(`🔗 Health check :    http://localhost:${PORT}/health`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n⏳ ${signal} reçu — arrêt en cours…`);

  for (const sessionId of Object.keys(transports)) {
    try {
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Erreur à la fermeture de la session ${sessionId}:`, error);
    }
  }

  server.close(() => {
    console.log("👋 Serveur arrêté proprement.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
