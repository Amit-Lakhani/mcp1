#!/usr/bin/env node

import dotenv from "dotenv";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { discoverTools } from "./lib/tools.js";

import path from "path";
import { fileURLToPath } from "url";

console.log("✅ Script started");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log("✅ .env loaded");

const SERVER_NAME = "generated-mcp-server";

async function transformTools(tools) {
  console.log("🔧 Transforming tools");
  return tools
    .map((tool) => {
      const definitionFunction = tool.definition?.function;
      if (!definitionFunction) return;
      return {
        name: definitionFunction.name,
        description: definitionFunction.description,
        inputSchema: definitionFunction.parameters,
      };
    })
    .filter(Boolean);
}

async function setupServerHandlers(server, tools) {
  console.log("🛠️ Setting up server handlers");

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.log("📥 Received request: listTools");
    return {
      tools: await transformTools(tools),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    console.log(`⚙️ Calling tool: ${toolName}`);

    const tool = tools.find((t) => t.definition.function.name === toolName);
    if (!tool) {
      console.error(`❌ Tool not found: ${toolName}`);
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }

    const args = request.params.arguments;
    const requiredParameters =
      tool.definition?.function?.parameters?.required || [];

    for (const requiredParameter of requiredParameters) {
      if (!(requiredParameter in args)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Missing required parameter: ${requiredParameter}`
        );
      }
    }

    try {
      const result = await tool.function(args);
      console.log("✅ Tool executed successfully");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("[Error] Failed to execute tool:", error);
      throw new McpError(ErrorCode.InternalError, `API error: ${error.message}`);
    }
  });
}

async function run() {
  console.log("🚀 run() function started");

  const args = process.argv.slice(2);
  const isSSE = args.includes("--sse");
  console.log(`🔍 Mode selected: ${isSSE ? "SSE" : "STDIO"}`);

  const tools = await discoverTools();
  console.log("🧰 Tools discovered:", tools.map(t => t.definition?.function?.name));

  if (isSSE) {
    const app = express();
    const transports = {};
    const servers = {};

    app.get("/sse", async (_req, res) => {
      console.log("🌐 /sse endpoint hit");

      const server = new Server(
        {
          name: SERVER_NAME,
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      server.onerror = (error) => console.error("[Error]", error);
      await setupServerHandlers(server, tools);

      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      servers[transport.sessionId] = server;

      res.on("close", async () => {
        console.log("🔌 SSE connection closed");
        delete transports[transport.sessionId];
        await server.close();
        delete servers[transport.sessionId];
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId;
      const transport = transports[sessionId];
      const server = servers[sessionId];

      if (transport && server) {
        console.log(`📨 Message received for session: ${sessionId}`);
        await transport.handlePostMessage(req, res);
      } else {
        console.error("❌ No server found for sessionId:", sessionId);
        res.status(400).send("No transport/server found for sessionId");
      }
    });

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`✅ [SSE Server] running on http://localhost:${port}`);
    });

  } else {
    const server = new Server(
      {
        name: SERVER_NAME,
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    server.onerror = (error) => console.error("[Error]", error);
    await setupServerHandlers(server, tools);

    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down server");
      await server.close();
      process.exit(0);
    });

    const transport = new StdioServerTransport();
    console.log("💻 STDIO Server started. Awaiting input...");
    await server.connect(transport);
  }
}

run().catch((err) => console.error("❌ Script crashed:", err));
