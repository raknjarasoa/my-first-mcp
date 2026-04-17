# my-first-mcp

Un serveur MCP (Model Context Protocol) moderne construit avec TypeScript, Express et le SDK officiel `@modelcontextprotocol/sdk`. Ce serveur utilise le transport **Streamable HTTP (SSE)** au lieu de STDIO.

## Outils disponibles

Le serveur expose les tools suivants :
1. **`add`** : Additionne deux nombres (`a` et `b`).
2. **`get_pokemon`** : Récupère les informations d'un Pokémon via PokeAPI (paramètre : `name`).
3. **`get_weather`** : Récupère la météo actuelle via Open-Meteo (paramètres : `latitude` et `longitude`).
4. **`qui_est_l_avenir`** : Une petite blague qui retourne le nom : "Marie".

## Prérequis

- Node.js (version 18+ recommandée)
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

Ce serveur utilise le transport SSE. Vous devez configurer votre client pour qu'il se connecte à l'endpoint SSE fourni par Express.

### Claude Desktop / Claude Code / Cursor / RooCode

Si votre client supporte la configuration explicite d'un serveur MCP de type `sse` (Streamable HTTP) :

```json
{
  "mcpServers": {
    "my-first-mcp": {
      "command": "node",
      "args": ["/chemin/absolu/vers/le/projet/dist/index.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```
**Attention** : La plupart des clients (comme Claude Desktop, Cursor et RooCode) s'attendent par défaut à communiquer via `stdio` quand vous fournissez une commande. 
S'ils supportent l'intégration via une URL locale pour SSE (ce qui est le cas pour des intégrations avancées supportant le binding distant), vous pourrez utiliser :

```json
{
  "mcpServers": {
    "my-first-mcp-sse": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

*(Note : référez-vous à la documentation spécifique de votre client `opencode`, `roocode`, `vscode` pour la syntaxe exacte de la déclaration HTTP/SSE URL).*

## Architecture & Choix Techniques

- **Express** : Fournit le serveur HTTP robuste et gère le routage et les erreurs (400, 401, 500).
- **TypeScript** : Typage fort et sécurité.
- **Corps de la requête (Raw Parser)** : Configuration d'Express pour parser le corps de la requête des POST en brute (`express.raw`) tel que requis par l'implémentation de `SSEServerTransport` du SDK MCP.
- **Aucun bloatware** : Les dépendances sont minimales (Express, Axios, Dotenv, @modelcontextprotocol/sdk).
