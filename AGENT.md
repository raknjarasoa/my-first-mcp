# Agent Context: my-first-mcp

## Description du Projet
Ce projet est un serveur Model Context Protocol (MCP) construit avec TypeScript et Express. Il utilise l'implémentation officielle `@modelcontextprotocol/sdk` afin de fournir des "Tools" (outils) utilisables par des assistants IA via le transport **Streamable HTTP** (spec 2025-03-26+).

## Architecture & Tech Stack
- **Environnement** : Node.js 18+ (via `tsx` en développement, `node` classique avec `tsc` en production).
- **Langage** : TypeScript au format **ESM pur** (`"type": "module"`). Attention : Toujours utiliser l'extension `.js` lors des imports relatifs (config NodeNext).
- **Transport** : `StreamableHTTPServerTransport` — endpoint unique `POST /mcp` avec gestion multi-clients par sessions.
- **Serveur web** : Express.js avec `express.json()` pour le parsing.
- **Clients visés** : Claude Desktop, Cursor, OpenCode, RooCode (en paramétrant l'URL `http://localhost:3000/mcp`).
- **Dépendances principales** : `express`, `@modelcontextprotocol/sdk`, `dotenv`.
- **Pas de dépendance HTTP client** : Utilisation de `fetch` natif (Node 18+) avec `AbortController` pour les timeouts.

## Structure du Projet
```
src/
├── index.ts           # Serveur Express + transport Streamable HTTP + health check + graceful shutdown
├── mcp.ts             # Factory createMcpServer() + registre de tools (Map-based)
├── tools/             # Un fichier par tool, chacun exporte { definition, handler }
│   ├── add.ts
│   ├── get-pokemon.ts
│   ├── get-weather.ts
│   └── qui-est-l-avenir.ts
└── utils/
    └── fetch.ts       # Wrapper fetch avec timeout (AbortController)
```

## Outils (Tools) implémentés
1. `add` : Additionne deux nombres.
2. `get_pokemon` : Consulte l'API `https://pokeapi.co/api/v2/pokemon/:name`.
3. `get_weather` : Consulte l'API Open-Meteo pour obtenir la météo locale depuis des coordonnées.
4. `qui_est_l_avenir` : Une "easter egg" retournant "Marie".

## Endpoints HTTP
- `POST /mcp` : Endpoint principal — JSON-RPC messages (initialize + tool calls).
- `GET /mcp` : SSE stream pour notifications serveur → client.
- `DELETE /mcp` : Terminaison de session.
- `GET /health` : Health check (status, uptime, nombre de sessions actives).

## Scripts et Commandes
- **`npm run dev`** : Démarre le serveur avec hot-reload (`tsx watch src/index.ts`). Port par défaut: 3000.
- **`npm run build`** : Nettoie le dossier `dist/` et recompile avec TypeScript.
- **`npm start`** : Démarre la version de production compilée.

## Règles d'Aide pour l'Agent
Lorsque vous modifiez ou assistez l'utilisateur sur ce projet :
1. **Respecter ESM** : Toujours utiliser l'extension `.js` dans les imports relatifs.
2. **Ne pas casser le transport MCP** : L'endpoint `/mcp` DOIT utiliser `express.json()` comme middleware global, requis par `StreamableHTTPServerTransport`.
3. **Maintien du SDK** : Privilégier les méthodes du SDK MCP standard.
4. **Variables d'environnement** : Ne jamais intégrer en dur de secrets. Utiliser le `.env`.
5. **Erreurs** : Renvoyer des erreurs au format JSON-RPC standard (`{ jsonrpc: "2.0", error: { code, message }, id }`).

## Exemples d'ajouts de Tool
Si l'utilisateur vous demande d'ajouter un nouvel Outil :
1. Créez un fichier dans `src/tools/` qui exporte `definition` (type `Tool`) et `handler` (fonction async).
2. Importez-le dans `src/mcp.ts` et ajoutez-le au tableau `tools`.
3. Le registre dynamique (Map) gère le dispatch automatiquement — aucun `if/else` à modifier.
