# Agent Context: my-first-mcp

## Description du Projet
Ce projet est un serveur Model Context Protocol (MCP) construit avec TypeScript et Express. Il utilise l'implémentation officielle `@modelcontextprotocol/sdk` afin de fournir des "Tools" (outils) utilisables par des assistants IA via le transport **Streamable HTTP (SSE)**.

## Architecture & Tech Stack
- **Environnement** : Node.js (via `tsx` en développement, `node` classique avec `tsc` en production).
- **Langage** : TypeScript au format **ESM pur** (`"type": "module"`). Attention : Toujours utiliser l'extension `.js` ou `.ts` lors des imports relatifs, selon la config NodeNext (ex: `import { mcpServer } from "./mcp.js";`).
- **Serveur web** : Express.js gérant le routing SSE (`GET /sse`) et la réception des messages bruts (`POST /message` avec parsing `express.raw`).
- **Clients visés** : Claude Desktop, Cursor, OpenCode, RooCode (en paramétrant l'accès SSE/HTTP local).
- **Dépendances principales** : `express`, `@modelcontextprotocol/sdk`, `axios`, `dotenv`.

## Outils (Tools) implémentés
Le serveur expose un ensemble d'outils (dans `src/mcp.ts`) :
1. `add` : Additionne deux nombres.
2. `get_pokemon` : Consulte l'API `https://pokeapi.co/api/v2/pokemon/:name`.
3. `get_weather` : Consulte l'API Open-Meteo pour obtenir la météo locale depuis des coordonnées.
4. `qui_est_l_avenir` : Une "easter egg" retournant "Marie".

## Scripts et Commandes
- **`npm run dev`** : Démarre le serveur avec hot-reload (`tsx watch src/index.ts`). Serveur par défaut sur `http://localhost:3000`.
- **`npm run build`** : Nettoie le dossier `dist/` et recompile avec TypeScript.
- **`npm start`** : Démarre la version de production compilée.

## Règles d'Aide pour l'Agent (OpenCode / RooCode)
Lorsque vous modifiez ou assistez l'utilisateur sur ce projet :
1. **Respecter ESM** : Modifiez soigneusement les imports. NodeJS requiert l'extension de fichier lors de l'utilisation du module ECMAScript pour un fichier local.
2. **Ne pas casser le transport MCP** : L'endpoint Express `/message` DOIT ABSOLUMENT garder la configuration du middleware `express.raw` sans interférence d'un `express.json` global, sinon le SDK MCP (`SSEServerTransport`) ne parviendra pas à interpréter correctement le stream.
3. **Maintien du SDK** : Privilégier les méthodes du SDK MCP standard plutôt que de créer des implémentations de protocoles customisées.
4. **Gestion des variables d'environnement** : Ne jamais intégrer en dur de secrets (comme l'API Key optionnelle ou les ports), utiliser le `.env`.
5. **Erreurs HTTP** : Si vous implémentez un middleware d'authentification ou des logs, maintenez un comportement d'erreur standardisé JSON (`400`, `401`, `500`).

## Exemples d'ajouts de Tool
Si l'utilisateur vous demande d'ajouter un nouvel Outil :
1. Créez un outil (interface `Tool` issue de `@modelcontextprotocol/sdk/types.js`).
2. Définissez le `inputSchema` de type JSON Schema.
3. Ajoutez l'outil au `ListToolsRequestSchema` dans `.setRequestHandler`.
4. Ajoutez la logique d'exécution dans le `CallToolRequestSchema` dans le try/catch principal, et assurez-vous de renvoyer l'objet standard : `{ content: [{ type: "text", text: "..." }], isError: false }`.
