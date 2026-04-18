# Agent Context: my-first-mcp

## Project Description

This project is a Model Context Protocol (MCP) server built with TypeScript and Express. It uses the official `@modelcontextprotocol/sdk` implementation to provide "Tools" usable by AI assistants via the **Streamable HTTP** transport (spec 2025-03-26+).

## Architecture & Tech Stack

- **Environment**: Node.js 22+ (via `tsx` in development, standard `node` with `tsc` in production).
- **Language**: TypeScript in **pure ESM** format (`"type": "module"`). Note: Always use the `.js` extension for relative imports (NodeNext config).
- **Transport**: `StreamableHTTPServerTransport` — single endpoint `POST /mcp` with multi-client session management.
- **Web server**: Express.js with `express.json()` for parsing.
- **Target clients**: Claude Desktop, Cursor, OpenCode, RooCode (by configuring the URL `http://localhost:3000/mcp`).
- **Main dependencies**: `express`, `@modelcontextprotocol/sdk`, `dotenv`.
- **No HTTP client dependency**: Use of native `fetch` (Node 22+) with `AbortController` for timeouts.

## Project Structure

```
src/
├── index.ts           # Express server + Streamable HTTP transport + health check + graceful shutdown
├── mcp.ts             # Factory createMcpServer() + tool registry (Map-based)
├── tools/             # One file per tool, each exporting { definition, handler }
│   ├── add.ts
│   ├── get-pokemon.ts
│   ├── get-weather.ts
│   └── qui-est-l-avenir.ts
└── utils/
    └── fetch.ts       # fetch wrapper with timeout (AbortController)
```

## Implemented Tools

1. `add`: Adds two numbers.
2. `get_pokemon`: Queries the `https://pokeapi.co/api/v2/pokemon/:name` API.
3. `get_weather`: Queries the Open-Meteo API to get local weather from coordinates.
4. `qui_est_l_avenir`: An "easter egg" returning "Marie".

## HTTP Endpoints

- `POST /mcp`: Main endpoint — JSON-RPC messages (initialize + tool calls).
- `GET /mcp`: SSE stream for server → client notifications.
- `DELETE /mcp`: Session termination.
- `GET /health`: Health check (status, uptime, number of active sessions).

## Scripts and Commands

- **`npm run dev`**: Starts the server with hot-reload (`tsx watch src/index.ts`). Default port: 3000.
- **`npm run build`**: Cleans the `dist/` folder and recompiles with TypeScript.
- **`npm start`**: Starts the compiled production version.

## Agent Aid Rules

When modifying or assisting the user on this project:

1. **Respect ESM**: Always use the `.js` extension in relative imports.
2. **Do not break the MCP transport**: The `/mcp` endpoint MUST use `express.json()` as a global middleware, required by `StreamableHTTPServerTransport`.
3. **SDK maintenance**: Prefer standard MCP SDK methods.
4. **Environment variables**: Never hardcode secrets. Use `.env`.
5. **Errors**: Return errors in the standard JSON-RPC format (`{ jsonrpc: "2.0", error: { code, message }, id }`).

## Examples of Adding a Tool

If the user asks you to add a new Tool:

1. Create a file in `src/tools/` that exports `definition` (type `Tool`) and `handler` (async function).
2. Import it into `src/mcp.ts` and add it to the `tools` array.
3. The dynamic registry (Map) handles the dispatch automatically — no `if/else` to modify.
