# Anthropic Integration Guide

How to connect Claude (via Claude Desktop or the Anthropic API) to the
Choo-Choo USA train simulation through the Model Context Protocol (MCP).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Claude Desktop Setup](#claude-desktop-setup)
5. [Build Instructions](#build-instructions)
6. [Environment Variables](#environment-variables)
7. [Architecture Diagram](#architecture-diagram)
8. [How the Bridge Works](#how-the-bridge-works)
9. [Direct Anthropic API Integration](#direct-anthropic-api-integration)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The MCP server is the middleware between Claude and the browser-based train
simulation. It exposes 28 tools (13 query, 6 control, 9 scenario) that let
an LLM inspect and manipulate every aspect of the running simulation.

The communication chain is:

```
Claude Desktop / Anthropic API
        |
        |  (stdio / JSON-RPC over MCP protocol)
        v
   MCP Server  (Node.js process)
        |
        |  (WebSocket, JSON-RPC 2.0, port 3001)
        v
   Browser mcpBridge  (client-side JS in the Choo-Choo USA app)
        |
        |  (direct function calls)
        v
   Zustand Stores  (simulation state: trains, stations, routes, cargo, etc.)
```

Claude sends tool calls via the MCP protocol. The MCP server translates each
tool call into a JSON-RPC request, sends it over a WebSocket to the browser,
and returns the browser's response back to Claude.

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | >= 18 | Runs the MCP server |
| npm | >= 9 | Installs dependencies |
| Claude Desktop | Latest | MCP host that launches and communicates with the server |
| Choo-Choo USA | Running in a browser tab | The simulation the server bridges to |

The browser tab must be loaded with the `?mcp=true` query parameter to
activate the WebSocket bridge client. Without this parameter, the browser
will not connect to the MCP server and all tool calls will time out.

Example URL:

```
http://localhost:5173/?mcp=true
```

---

## Quick Start

```bash
# 1. Build the MCP server
cd choo-choo-usa/mcp-server
npm install
npm run build

# 2. Start the Choo-Choo USA app (in a separate terminal)
cd choo-choo-usa
npm run dev

# 3. Open the app in a browser with the MCP bridge enabled
open "http://localhost:5173/?mcp=true"

# 4. Configure Claude Desktop (see next section), then restart Claude Desktop
```

Once Claude Desktop restarts, it will automatically launch the MCP server
process and connect over stdio. When you open the browser tab with `?mcp=true`,
the browser connects to the MCP server's WebSocket on port 3001. At that
point, Claude can use all 28 tools.

---

## Claude Desktop Setup

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "choo-choo-usa": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "env": { "BROWSER_WS_URL": "ws://localhost:3001" }
    }
  }
}
```

**Important notes:**

- The `args` path is relative to the working directory where Claude Desktop
  launches the process. If you encounter path issues, use an absolute path
  instead (e.g., `"/Users/you/Trains/choo-choo-usa/mcp-server/dist/index.js"`).
- The `BROWSER_WS_URL` environment variable is informational for the server
  logs. The actual WebSocket port is controlled by `BROWSER_WS_PORT` (default
  3001). Set both if you change the port.
- After editing the config, restart Claude Desktop completely (quit and reopen).

---

## Build Instructions

```bash
cd choo-choo-usa/mcp-server

# Install dependencies
npm install

# Compile TypeScript to JavaScript
npm run build
# Output: dist/index.js (and all other compiled modules)

# Verify the build succeeded
ls dist/index.js
```

For development with hot-reload (does not require a build step):

```bash
npm run dev
# Uses tsx to run TypeScript directly
```

The production entry point is `dist/index.js`. The dev entry point is
`src/index.ts` (run via tsx).

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_WS_PORT` | `3001` | Port number for the WebSocket server that the browser connects to |
| `BROWSER_WS_URL` | `ws://localhost:3001` | Informational; used in Claude Desktop config for documentation purposes |

To change the WebSocket port:

```json
{
  "mcpServers": {
    "choo-choo-usa": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "env": {
        "BROWSER_WS_PORT": "4000",
        "BROWSER_WS_URL": "ws://localhost:4000"
      }
    }
  }
}
```

You must also update the browser-side bridge to connect to the same port.

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|                       Claude Desktop                             |
|  (or any MCP-compatible host / Anthropic API client)             |
+------------------------------------------------------------------+
         |                                       ^
         | MCP tool_call (JSON-RPC over stdio)   | MCP tool_result
         v                                       |
+------------------------------------------------------------------+
|                     MCP Server (Node.js)                         |
|                                                                  |
|  +-----------------------+  +-------------------------------+    |
|  |   StdioServerTransport|  |  BridgeTransport              |    |
|  |   (reads stdin,       |  |  (WebSocket server on :3001)  |    |
|  |    writes stdout)     |  |                               |    |
|  +-----------+-----------+  +-------+-----------+-----------+    |
|              |                      |           ^                |
|              v                      |           |                |
|  +-----------+-----------+          |    JSON-RPC response       |
|  |   McpServer           |          |           |                |
|  |   28 registered tools |          |           |                |
|  |   - 13 query          +--------->+           |                |
|  |   - 6 control         |  JSON-RPC request    |                |
|  |   - 9 scenario        |          |           |                |
|  +-----------------------+          |           |                |
|                                     |           |                |
+------------------------------------------------------------------+
                                      |           |
                        WebSocket     |           |
                        (port 3001)   |           |
                                      v           |
+------------------------------------------------------------------+
|                   Browser (Choo-Choo USA App)                    |
|                                                                  |
|  +----------------------------+                                  |
|  |  mcpBridge (WebSocket      |                                  |
|  |  client, JSON-RPC handler) |                                  |
|  +----------------------------+                                  |
|              |           ^                                       |
|              v           |                                       |
|  +----------------------------+  +-----------------------------+ |
|  |  Zustand Stores            |  |  PixiJS / Leaflet / React  | |
|  |  - useSimulationStore      |  |  (visual rendering)        | |
|  |  - useTrainStore           |  |                             | |
|  |  - useStationStore         |  +-----------------------------+ |
|  |  - useRouteStore           |                                  |
|  |  - useCargoStore           |                                  |
|  |  - usePassengerStore       |                                  |
|  |  - useStatsStore           |                                  |
|  |  - useEventLogStore        |                                  |
|  +----------------------------+                                  |
|                                                                  |
+------------------------------------------------------------------+
```

### Data Flow for a Single Tool Call

1. Claude sends a tool call (e.g., `get_all_trains`) via the MCP protocol
   over stdio.
2. The `McpServer` matches the tool name, validates parameters with Zod,
   and calls the tool handler function.
3. The handler calls `transport.sendRequest('get_all_trains', {})`, which
   creates a JSON-RPC 2.0 request with a unique ID and sends it over the
   WebSocket.
4. The browser's `mcpBridge` receives the request, reads the corresponding
   Zustand store, serializes the data, and sends a JSON-RPC response back.
5. `BridgeTransport` matches the response ID to the pending request and
   resolves the promise.
6. The tool handler wraps the result in an MCP content block
   (`{ type: 'text', text: JSON.stringify(result) }`) and returns it.
7. Claude receives the response and can use the data in its reasoning.

### Message Queue and Disconnection

If the browser is not connected when a tool call arrives, the request is
queued in memory. When the browser connects (or reconnects), all queued
messages are flushed automatically. If the browser disconnects while
requests are pending, those requests are rejected with a
`"Browser disconnected"` error.

Each request has a 10-second timeout. If the browser does not respond
within 10 seconds, the tool call returns an error.

---

## How the Bridge Works

### JSON-RPC Protocol

The MCP server and browser communicate using JSON-RPC 2.0 over WebSocket.

**Request** (MCP server to browser):

```json
{
  "id": "42",
  "method": "get_all_trains",
  "params": {}
}
```

**Response** (browser to MCP server):

```json
{
  "id": "42",
  "result": [
    {
      "id": "train-001",
      "name": "The Sunrise Express",
      "type": "steam",
      "status": "en_route",
      "cargoCount": 3,
      "passengerCount": 12
    }
  ]
}
```

**Error response**:

```json
{
  "id": "42",
  "error": {
    "code": -32601,
    "message": "Unknown method: nonexistent_method"
  }
}
```

### Browser-Side Activation

The browser app checks for the `?mcp=true` query parameter on page load.
When present, it initializes a WebSocket client that connects to
`ws://localhost:3001` and registers handlers for all 28 methods. Each
handler reads from or writes to the appropriate Zustand store.

---

## Direct Anthropic API Integration

If you are not using Claude Desktop, you can integrate with the Anthropic
Messages API directly by defining the tools in your API call. Below is a
complete Python example.

### Python Example

```python
"""
direct_api_example.py

Demonstrates calling the Choo-Choo USA simulation via the Anthropic
Messages API with tool use. This bypasses Claude Desktop and the MCP
protocol, communicating directly with the browser's WebSocket bridge.

Prerequisites:
    - pip install anthropic websockets
    - Choo-Choo USA running in browser with ?mcp=true
    - ANTHROPIC_API_KEY environment variable set

Usage:
    python direct_api_example.py
"""

import anthropic
import asyncio
import json
import websockets

# ---------------------------------------------------------------------------
# Tool definitions matching the MCP server's 28 tools
# (showing a representative subset for brevity)
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "get_simulation_state",
        "description": (
            "Get the current simulation state including the in-game clock, "
            "speed multiplier, day number, time of day, and statistics."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_all_trains",
        "description": (
            "Get a summary list of all trains in the simulation with their "
            "status, position, cargo count, and passenger count."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_train",
        "description": "Get full details for a specific train by ID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "trainId": {
                    "type": "string",
                    "description": "The unique train identifier",
                }
            },
            "required": ["trainId"],
        },
    },
    {
        "name": "set_speed",
        "description": "Set the simulation speed multiplier (0, 1, 5, 15, 60).",
        "input_schema": {
            "type": "object",
            "properties": {
                "speed": {
                    "type": "integer",
                    "enum": [0, 1, 5, 15, 60],
                    "description": "Simulation speed multiplier",
                }
            },
            "required": ["speed"],
        },
    },
    {
        "name": "dispatch_train",
        "description": "Dispatch a train on a specific route.",
        "input_schema": {
            "type": "object",
            "properties": {
                "trainId": {
                    "type": "string",
                    "description": "The ID of the train to dispatch",
                },
                "routeId": {
                    "type": "string",
                    "description": "The ID of the route",
                },
            },
            "required": ["trainId", "routeId"],
        },
    },
    {
        "name": "create_station",
        "description": "Create a new station in the simulation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "city": {"type": "string"},
                "state": {"type": "string"},
                "position": {
                    "type": "array",
                    "items": {"type": "number"},
                    "minItems": 2,
                    "maxItems": 2,
                },
                "size": {
                    "type": "string",
                    "enum": ["major_hub", "regional", "local"],
                },
                "industries": {"type": "array", "items": {"type": "object"}},
                "description": {"type": "string"},
            },
            "required": [
                "id", "name", "city", "state", "position",
                "size", "industries", "description",
            ],
        },
    },
]

# ---------------------------------------------------------------------------
# WebSocket bridge client
# ---------------------------------------------------------------------------

_request_id = 0

async def send_to_bridge(method: str, params: dict) -> dict:
    """Send a JSON-RPC request to the browser bridge and return the result."""
    global _request_id
    _request_id += 1

    async with websockets.connect("ws://localhost:3001") as ws:
        request = {"id": str(_request_id), "method": method, "params": params}
        await ws.send(json.dumps(request))
        raw = await asyncio.wait_for(ws.recv(), timeout=10.0)
        response = json.loads(raw)

        if "error" in response and response["error"]:
            raise RuntimeError(
                f"Bridge error [{response['error']['code']}]: "
                f"{response['error']['message']}"
            )
        return response.get("result", {})


# ---------------------------------------------------------------------------
# Tool execution handler
# ---------------------------------------------------------------------------

def handle_tool_use(tool_name: str, tool_input: dict) -> str:
    """Execute a tool call by forwarding it to the browser bridge."""
    result = asyncio.get_event_loop().run_until_complete(
        send_to_bridge(tool_name, tool_input)
    )
    return json.dumps(result, indent=2)


# ---------------------------------------------------------------------------
# Main conversation loop
# ---------------------------------------------------------------------------

def main():
    client = anthropic.Anthropic()  # Uses ANTHROPIC_API_KEY env var

    messages = [
        {
            "role": "user",
            "content": (
                "You are controlling a railroad simulation. First check "
                "the simulation state, then list all the trains and tell "
                "me what is happening."
            ),
        }
    ]

    # Agentic loop: keep calling the API until there are no more tool calls
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            tools=TOOLS,
            messages=messages,
        )

        # Collect assistant content blocks
        assistant_content = response.content
        messages.append({"role": "assistant", "content": assistant_content})

        # Check for tool use blocks
        tool_use_blocks = [
            block for block in assistant_content if block.type == "tool_use"
        ]

        if not tool_use_blocks:
            # No more tool calls; print the final text response
            for block in assistant_content:
                if hasattr(block, "text"):
                    print(block.text)
            break

        # Execute each tool call and add results
        tool_results = []
        for block in tool_use_blocks:
            print(f"  [Tool call] {block.name}({json.dumps(block.input)})")
            result_text = handle_tool_use(block.name, block.input)
            print(f"  [Result]    {result_text[:200]}...")
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_text,
                }
            )

        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    main()
```

### Key Differences from Claude Desktop

| Aspect | Claude Desktop (MCP) | Direct API |
|--------|---------------------|------------|
| Transport | stdio (MCP server runs as child process) | Your code manages the WebSocket bridge |
| Tool discovery | Automatic via MCP `tools/list` | You define tool schemas in the API call |
| Session management | Claude Desktop handles lifecycle | You manage the conversation loop |
| Authentication | Claude Desktop handles it | You provide `ANTHROPIC_API_KEY` |

---

## Troubleshooting

### "Request timed out after 10000ms"

**Cause**: The browser is not connected to the MCP server's WebSocket.

**Resolution**:
1. Verify the Choo-Choo USA app is running: `open http://localhost:5173/?mcp=true`
2. Confirm the `?mcp=true` parameter is in the URL.
3. Check that port 3001 is not blocked or in use by another process:
   ```bash
   lsof -i :3001
   ```
4. Look at the MCP server's stderr output for connection messages. In Claude
   Desktop, check the MCP server logs in the developer console.

### "Browser disconnected"

**Cause**: The browser tab was closed, refreshed, or navigated away.

**Resolution**:
1. Reopen the app at `http://localhost:5173/?mcp=true`.
2. The MCP server will detect the reconnection and flush any queued messages.
3. If tool calls were pending when the browser disconnected, they will have
   already failed. Claude will need to retry them.

### Claude Desktop does not show the MCP server

**Cause**: Configuration file is malformed or the server path is wrong.

**Resolution**:
1. Validate the JSON syntax in `claude_desktop_config.json`.
2. Verify the `dist/index.js` path is correct and the build has been run:
   ```bash
   ls choo-choo-usa/mcp-server/dist/index.js
   ```
3. Restart Claude Desktop completely (quit and reopen).
4. Check Claude Desktop's developer logs for MCP initialization errors.

### "Cannot find module" or TypeScript errors on startup

**Cause**: The MCP server was not built, or the build is stale.

**Resolution**:
```bash
cd choo-choo-usa/mcp-server
npm install
npm run build
```

### Port 3001 is already in use

**Cause**: Another process (or a previous MCP server instance) is using port 3001.

**Resolution**:
1. Find and kill the conflicting process:
   ```bash
   lsof -i :3001
   kill <PID>
   ```
2. Or change the port by setting `BROWSER_WS_PORT` in the Claude Desktop
   config and updating the browser-side bridge accordingly.

### Tools return empty or unexpected data

**Cause**: The simulation has not been initialized, or the simulation is
paused at the very start before any trains, stations, or routes exist.

**Resolution**:
1. Confirm the simulation is loaded with data (check that stations and trains
   appear in the browser).
2. Use `get_simulation_state` to check the clock and speed. If the speed is
   0 (paused), use `set_speed` to start time.
3. Use `reset_simulation` to reload the default scenario data.

### WebSocket connection keeps dropping

**Cause**: The browser tab is going to sleep (browser throttling inactive tabs).

**Resolution**:
1. Keep the Choo-Choo USA browser tab visible (do not minimize it).
2. Alternatively, use a browser flag to disable tab throttling for development.
3. The MCP server queues messages during disconnection and flushes them on
   reconnect, so brief disconnections are handled gracefully.
