import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from "./mcp.js";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

let transport: SSEServerTransport | null = null;

// Middleware basique pour gérer les erreurs 401 si un API_KEY est configuré dans le .env
app.use((req: Request, res: Response, next: NextFunction) => {
  if (API_KEY) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      res.status(401).json({ error: "Unauthorized - API Key manquante ou invalide." });
      return;
    }
  }
  next();
});

// Endpoint pour initier la connexion SSE
app.get("/sse", async (req: Request, res: Response) => {
  try {
    // Le transport SSE s'occupe de gérer la réponse
    transport = new SSEServerTransport("/message", res);
    await mcpServer.connect(transport);
    console.log("Client SSE connecté");

    req.on("close", () => {
      console.log("Client SSE déconnecté");
      transport = null;
    });
  } catch (error) {
    console.error("Erreur lors de la connexion SSE:", error);
    res.status(500).json({ error: "Erreur interne du serveur lors de l'initialisation du SSE." });
  }
});

// Endpoint pour recevoir les messages clients (POST)
// On parse le body en RAW comme requis par le SDK
app.post(
  "/message",
  express.raw({ type: "*/*", limit: "10mb" }),
  async (req: Request, res: Response) => {
    // Gestion de l'erreur 400
    if (!transport) {
      res.status(400).json({ error: "Bad Request - Aucune connexion SSE active." });
      return;
    }

    try {
      // Confier le traitement du message HTTP au Transport SDK
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("Erreur lors du traitement du message (500):", error);
      res.status(500).json({ error: "Erreur interne lors du traitement du message." });
    }
  }
);

// Fallback (404) pour les autres routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route non trouvée." });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur MCP Express démarré sur le port ${PORT}`);
  console.log(`🔗 Endpoint SSE : http://localhost:${PORT}/sse`);
  console.log(`🔗 Endpoint Messages : http://localhost:${PORT}/message`);
});
