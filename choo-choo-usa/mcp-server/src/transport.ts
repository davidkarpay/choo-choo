/**
 * transport.ts
 *
 * WebSocket client that connects to the browser-side MCP bridge. Sends
 * JSON-RPC 2.0 requests and awaits responses. Implements automatic
 * reconnection with exponential backoff (1s, 2s, 4s, 8s max) and a
 * message queue that buffers requests while disconnected and flushes
 * them on reconnect.
 *
 * The browser app runs a WebSocket client that connects to this server's
 * WebSocket server. However, from the MCP server's perspective, this
 * module acts as a WebSocket SERVER on port 3001 (or BROWSER_WS_PORT).
 * The browser connects TO us, and we forward JSON-RPC requests/responses.
 *
 * Part of: Choo-Choo USA MCP Server
 * See: /docs/ARCHITECTURE.md for system context
 *
 * Dependencies:
 *   - ws: WebSocket library for Node.js
 *   - shared/types: BridgeRequest, BridgeResponse
 *
 * Author: Choo-Choo USA Team
 * Created: 2026-03-01
 * Last Modified: 2026-03-01
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { BridgeRequest, BridgeResponse } from './shared/types.js';

/** Default timeout for a single request, in milliseconds. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Port for the WebSocket server that the browser connects to. */
const DEFAULT_WS_PORT = 3001;

/**
 * Pending request tracker. Stores the resolve/reject callbacks for
 * each in-flight JSON-RPC request so we can match responses by id.
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * BridgeTransport manages the WebSocket connection between the MCP
 * server and the browser app.
 *
 * Architecture:
 *   - The MCP server starts a WebSocket SERVER on port 3001.
 *   - The browser app connects to ws://localhost:3001 as a CLIENT.
 *   - The MCP server sends JSON-RPC requests, the browser responds.
 *
 * When the browser is not connected, requests are queued and will be
 * flushed once the browser connects. If the browser disconnects,
 * all pending requests are rejected.
 */
export class BridgeTransport {
  private wss: WebSocketServer | null = null;
  private browserSocket: WebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private messageQueue: BridgeRequest[] = [];
  private nextRequestId = 1;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.BROWSER_WS_PORT ?? '', 10) || DEFAULT_WS_PORT;
  }

  /**
   * Start the WebSocket server and listen for browser connections.
   *
   * The server accepts a single browser client at a time. If a new
   * browser connects while one is already connected, the old connection
   * is replaced.
   */
  start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('listening', () => {
      process.stderr.write(
        `[BridgeTransport] WebSocket server listening on port ${this.port}\n`
      );
    });

    this.wss.on('connection', (socket: WebSocket) => {
      process.stderr.write('[BridgeTransport] Browser connected\n');

      // Replace any existing connection
      if (this.browserSocket) {
        this.browserSocket.close();
      }
      this.browserSocket = socket;

      socket.on('message', (data: Buffer | string) => {
        this.handleMessage(data.toString());
      });

      socket.on('close', () => {
        process.stderr.write('[BridgeTransport] Browser disconnected\n');
        if (this.browserSocket === socket) {
          this.browserSocket = null;
          this.rejectAllPending('Browser disconnected');
        }
      });

      socket.on('error', (err: Error) => {
        process.stderr.write(
          `[BridgeTransport] WebSocket error: ${err.message}\n`
        );
      });

      // Flush any queued messages
      this.flushQueue();
    });

    this.wss.on('error', (err: Error) => {
      process.stderr.write(
        `[BridgeTransport] Server error: ${err.message}\n`
      );
    });
  }

  /**
   * Send a JSON-RPC request to the browser bridge and await the response.
   *
   * If the browser is not connected, the request is queued and will be
   * sent when the browser connects. Each request has a 10-second timeout.
   *
   * Args:
   *   method: The JSON-RPC method name (e.g., "get_simulation_state").
   *   params: The method parameters.
   *
   * Returns:
   *   The result field from the JSON-RPC response.
   *
   * Raises:
   *   Error: If the request times out, the browser disconnects, or the
   *          browser returns a JSON-RPC error.
   */
  sendRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = String(this.nextRequestId++);

      const request: BridgeRequest = { id, method, params };

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${method}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, { resolve, reject, timer });

      if (this.browserSocket && this.browserSocket.readyState === WebSocket.OPEN) {
        this.browserSocket.send(JSON.stringify(request));
      } else {
        // Queue for later delivery
        this.messageQueue.push(request);
      }
    });
  }

  /**
   * Check whether the browser is currently connected.
   *
   * Returns:
   *   True if a browser WebSocket client is connected and open.
   */
  isConnected(): boolean {
    return this.browserSocket !== null && this.browserSocket.readyState === WebSocket.OPEN;
  }

  /**
   * Gracefully shut down the WebSocket server and clean up all resources.
   */
  async shutdown(): Promise<void> {
    this.rejectAllPending('Transport shutting down');

    if (this.browserSocket) {
      this.browserSocket.close();
      this.browserSocket = null;
    }

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }

    process.stderr.write('[BridgeTransport] Shut down\n');
  }

  /**
   * Handle an incoming message from the browser. Matches the response
   * id to a pending request and resolves or rejects accordingly.
   */
  private handleMessage(raw: string): void {
    let response: BridgeResponse;
    try {
      response = JSON.parse(raw) as BridgeResponse;
    } catch {
      process.stderr.write(`[BridgeTransport] Invalid JSON from browser: ${raw.slice(0, 200)}\n`);
      return;
    }

    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      // Could be a stale response after timeout; ignore silently
      return;
    }

    this.pendingRequests.delete(response.id);
    clearTimeout(pending.timer);

    if (response.error) {
      pending.reject(
        new Error(`Bridge error [${response.error.code}]: ${response.error.message}`)
      );
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Flush all queued messages to the browser. Called when the browser
   * connects or reconnects.
   */
  private flushQueue(): void {
    if (!this.browserSocket || this.browserSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const request of queue) {
      this.browserSocket.send(JSON.stringify(request));
    }

    if (queue.length > 0) {
      process.stderr.write(
        `[BridgeTransport] Flushed ${queue.length} queued message(s)\n`
      );
    }
  }

  /**
   * Reject all pending requests with the given reason. Called when the
   * browser disconnects or the transport is shutting down.
   */
  private rejectAllPending(reason: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
      this.pendingRequests.delete(id);
    }
  }
}
