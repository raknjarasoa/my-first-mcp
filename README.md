# my-first-mcp

Un serveur MCP (Model Context Protocol) construit avec TypeScript, Express et le SDK officiel `@modelcontextprotocol/sdk`. Ce serveur utilise le transport **Streamable HTTP** (spec 2025-03-26+) avec gestion multi-clients.

## Outils disponibles

Le serveur expose les tools suivants :

1. **`add`** : Additionne deux nombres (`a` et `b`).
2. **`get_pokemon`** : Récupère les informations d'un Pokémon via PokeAPI (paramètre : `name`).
3. **`get_weather`** : Récupère la météo actuelle via Open-Meteo (paramètres : `latitude` et `longitude`).
4. **`qui_est_l_avenir`** : Une petite blague qui retourne le nom : "Marie".

## Prérequis

- Node.js (version 18+)
- npm

## ⚙️ Installation

1. Cloner le projet ou l'initialiser.
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer l'environnement :
   Copier le fichier `.env.example` vers `.env`
   ```bash
   cp .env.example .env
   ```
   Vous pouvez configurer le port (défaut: 3000) et une clé `API_KEY` si vous souhaitez mettre en place l'authentification (401 géré).

## 🚀 Lancement

Pour lancer en développement (rechargement à chaud avec `tsx`) :

```bash
npm run dev
```

Pour compiler et lancer en production :

```bash
npm run build
npm start
```

## 🛠 Configuration dans les clients MCP

Ce serveur utilise le transport **Streamable HTTP**. Le endpoint unique est `POST /mcp`.

### Claude Desktop / Claude Code / Cursor / RooCode

Configuration avec URL locale Streamable HTTP :

```json
{
  "mcpServers": {
    "my-first-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

_(Note : référez-vous à la documentation spécifique de votre client pour la syntaxe exacte. La majorité des clients modernes supportent l'URL Streamable HTTP nativement.)_

## 📁 Architecture du projet

```
src/
├── index.ts           # Serveur Express + Streamable HTTP transport
├── mcp.ts             # Factory MCP Server + registre de tools
├── tools/
│   ├── add.ts         # Tool: addition
│   ├── get-pokemon.ts # Tool: PokeAPI
│   ├── get-weather.ts # Tool: Open-Meteo
│   └── qui-est-l-avenir.ts  # Tool: blague
└── utils/
    └── fetch.ts       # Fetch wrapper avec timeout
```

### Ajouter un nouvel outil

1. Créez `src/tools/mon-outil.ts` en exportant `definition` et `handler`.
2. Importez-le dans `src/mcp.ts` et ajoutez-le au tableau `tools`.
3. C'est tout — aucun `if/else` à modifier, le registre dynamique gère le dispatch.

## Architecture & Choix Techniques

- **Streamable HTTP** : Transport moderne (remplace SSE), gestion multi-clients via sessions.
- **Express** : Serveur HTTP robuste avec routage et gestion d'erreurs standardisée (JSON-RPC).
- **TypeScript ESM** : Typage strict et imports modernes (`"type": "module"`).
- **Native `fetch`** : Aucune dépendance HTTP tierce, timeouts intégrés via `AbortController`.
- **Health check** : `GET /health` pour monitoring et orchestration.
- **Graceful shutdown** : Fermeture propre de toutes les sessions actives sur `SIGTERM`/`SIGINT`.
