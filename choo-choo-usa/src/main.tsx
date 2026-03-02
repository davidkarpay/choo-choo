import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/storybook.css';
import { initMcpBridge } from './engine/mcpBridge';

// Initialize the MCP bridge if ?mcp=true is in the URL.
// This connects to the MCP server's WebSocket on port 3001
// so LLMs can query and control the simulation.
initMcpBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
