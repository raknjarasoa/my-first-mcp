#!/usr/bin/env node
import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp.js';

async function main() {
  const transport = new StdioServerTransport();
  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);

  // Important! When using stdio, you MUST use console.error for logging.
  // Using console.log will print to stdout and corrupt the JSON-RPC data stream.
  console.error('MCP Server is running via stdio');
}

main().catch(console.error);
