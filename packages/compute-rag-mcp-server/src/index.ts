import express from "express";
import https from "https";
import { readFileSync } from "fs";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createSession, startSessionCleanup } from "./session/store.js";
import { sessionMiddleware } from "./session/middleware.js";
import { SessionInitHeadersSchema } from "./schemas/sessionSchemas.js";
import { createMcpServer } from "./server.js";
import { PORT } from "./constants.js";

const app = express();
app.use(express.json());

app.post("/mcp/session/init", (req, res) => {
  const parsed = SessionInitHeadersSchema.safeParse(req.headers);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid headers",
      details: parsed.error.issues.map((i) => i.message),
    });
    return;
  }

  const computeToken = parsed.data["x-compute-token"];
  const llmKey = parsed.data["x-llm-key"];

  const userId =
    Buffer.from(computeToken.split(".")[1] ?? "", "base64").toString() ||
    "unknown";

  const session = createSession(computeToken, llmKey, userId);
  console.log(`[session] created ${session.sessionId} for user ${userId}`);

  res.json({ sessionId: session.sessionId, expiresAt: session.expiresAt });
});

app.post("/mcp", sessionMiddleware, async (req, res) => {
  const session = req.session!;
  const server = createMcpServer(() => session);

  const transport = new StreamableHTTPServerTransport();

  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

startSessionCleanup();

const mtlsCert = process.env.MTLS_CERT_PATH;
const mtlsKey = process.env.MTLS_KEY_PATH;
const mtlsCa = process.env.MTLS_CA_PATH;

if (mtlsCert && mtlsKey && mtlsCa) {
  https
    .createServer(
      {
        cert: readFileSync(mtlsCert),
        key: readFileSync(mtlsKey),
        ca: readFileSync(mtlsCa),
        requestCert: true,
        rejectUnauthorized: true,
      },
      app
    )
    .listen(PORT, () =>
      console.log(`[mTLS] listening on https://0.0.0.0:${PORT}`)
    );
} else {
  app.listen(PORT, () =>
    console.log(`[http] listening on http://0.0.0.0:${PORT}`)
  );
}
