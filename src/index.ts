#!/usr/bin/env node
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './mcp.js';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// ── Production safety assertion ────────────────────────────────────────────

if (process.env.NODE_ENV === 'production' && !API_KEY) {
  console.warn('Warning: API_KEY is not set. Server is running unauthenticated in production.');
}

// ── Session store with TTL ─────────────────────────────────────────────────

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastSeen: number;
}

const sessions: Record<string, SessionEntry> = {};
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Evict stale sessions that were never formally closed by the client.
setInterval(() => {
  const now = Date.now();
  for (const [sid, entry] of Object.entries(sessions)) {
    if (now - entry.lastSeen > SESSION_TTL_MS) {
      entry.transport.close().catch(() => {});
      delete sessions[sid];
      console.log(`Session ${sid} expired and was cleaned up.`);
    }
  }
}, 60_000).unref(); // .unref() so the interval does not block graceful shutdown

// ── Middleware ──────────────────────────────────────────────────────────────

// Parse JSON — required by StreamableHTTPServerTransport
app.use(express.json());

// Optional Bearer-token auth when API_KEY is set in .env.
// /health is explicitly excluded so monitoring tools can reach it unauthenticated.
if (API_KEY) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health') return next();

    const authHeader = req.headers.authorization;
    const expected = Buffer.from(`Bearer ${API_KEY}`);
    const actual = Buffer.from(authHeader ?? '');
    const isValid = actual.length === expected.length && timingSafeEqual(actual, expected);

    if (!isValid) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized — missing or invalid API key.' },
        id: null,
      });
      return;
    }
    next();
  });
}

// ── Health check ───────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeSessions: Object.keys(sessions).length,
  });
});

// ── MCP Streamable HTTP endpoint ──────────────────────────────────────────

// POST /mcp — handles JSON-RPC messages (initialize + all subsequent calls)
app.post('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId) {
      const entry = sessions[sessionId];
      if (entry) {
        // ── Existing session ──
        entry.lastSeen = Date.now();
        transport = entry.transport;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: invalid session ID or non-initialize request.',
          },
          id: null,
        });
        return;
      }
    } else if (isInitializeRequest(req.body)) {
      // ── New session (initialization request) ──
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          console.log(`Session initialized: ${newSessionId}`);
          sessions[newSessionId] = { transport, lastSeen: Date.now() };
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessions[sid]) {
          console.log(`Session closed: ${sid}`);
          delete sessions[sid];
        }
      };

      // Each session gets its own MCP server instance
      const mcpServer = createMcpServer();
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return; // Already handled
    } else {
      // ── Invalid request ──
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: invalid session ID or non-initialize request.',
        },
        id: null,
      });
      return;
    }

    // Handle request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error processing MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error.' },
        id: null,
      });
    }
  }
});

// GET /mcp — SSE stream for server-initiated notifications
app.get('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session ID.' },
      id: null,
    });
    return;
  }

  const entry = sessions[sessionId];
  if (!entry) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session ID.' },
      id: null,
    });
    return;
  }

  entry.lastSeen = Date.now();
  await entry.transport.handleRequest(req, res);
});

// DELETE /mcp — session termination
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session ID.' },
      id: null,
    });
    return;
  }

  const entry = sessions[sessionId];
  if (!entry) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or missing session ID.' },
      id: null,
    });
    return;
  }

  try {
    await entry.transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error closing session:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Error closing session.' },
        id: null,
      });
    }
  }
});

// ── Fallback (404) ─────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Start server ───────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`MCP server started on port ${PORT}`);
  console.log(`MCP endpoint:    http://localhost:${PORT}/mcp`);
  console.log(`Health check:    http://localhost:${PORT}/health`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down gracefully...`);

  for (const [sessionId, entry] of Object.entries(sessions)) {
    try {
      await entry.transport.close();
      delete sessions[sessionId];
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }
  }

  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );

  console.log('Server stopped cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
