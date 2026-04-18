import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as add from './tools/add.js';
import * as getPokemon from './tools/get-pokemon.js';
import * as getWeather from './tools/get-weather.js';
import * as quiEstLAvenir from './tools/qui-est-l-avenir.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

// ── Tool registry ──────────────────────────────────────────────────────────
// Each tool module exports { definition, inputSchema, handler }.
// To add a new tool, create a file in src/tools/ and call registerTool below.

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'my-first-mcp-server', version });

  server.registerTool(
    add.definition.name,
    { description: add.definition.description, inputSchema: add.inputSchema },
    add.handler
  );

  server.registerTool(
    getPokemon.definition.name,
    { description: getPokemon.definition.description, inputSchema: getPokemon.inputSchema },
    getPokemon.handler
  );

  server.registerTool(
    getWeather.definition.name,
    { description: getWeather.definition.description, inputSchema: getWeather.inputSchema },
    getWeather.handler
  );

  server.registerTool(
    quiEstLAvenir.definition.name,
    { description: quiEstLAvenir.definition.description },
    () => quiEstLAvenir.handler({})
  );

  return server;
}
