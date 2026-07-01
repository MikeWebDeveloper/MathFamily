#!/usr/bin/env -S npx tsx
import { createFeedServer, runStdio } from "@mathfamily/agent-feed";
import { loungeAccessAdapter } from "./adapter";

// Standalone MCP feed for LoungeMath (Surface 2). Free now; metering seam ready.
const server = await createFeedServer(loungeAccessAdapter(), { name: "loungemath-mcp" });
await runStdio(server);
