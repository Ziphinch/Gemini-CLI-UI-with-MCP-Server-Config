const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let commandHistory = [];
const processes = new Map();
let mcpSocket = null;
let mcpConfig = null;

// Load MCP server config
try {
  const configData = fs.readFileSync('config.json');
  mcpConfig = JSON.parse(configData).mcp_server;
} catch (error) {
  console.error('Error reading config.json:', error);
}

function connectToMcpServer() {
  if (!mcpConfig || mcpSocket) return;

  mcpSocket = new net.Socket();

  mcpSocket.connect(mcpConfig.port, mcpConfig.host, () => {
    console.log('Connected to MCP server');
    broadcast(JSON.stringify({ type: 'mcp_status', data: 'Connected' }));
  });

  mcpSocket.on('data', (data) => {
    const messages = data.toString().split('\n').filter(msg => msg);
    messages.forEach(message => {
      try {
        const parsedMessage = JSON.parse(message);
        broadcast(JSON.stringify({ type: 'mcp_response', data: parsedMessage }));
      } catch (error) {
        console.error('Error parsing MCP response:', error);
      }
    });
  });

  mcpSocket.on('close', () => {
    console.log('Disconnected from MCP server');
    mcpSocket = null;
    broadcast(JSON.stringify({ type: 'mcp_status', data: 'Disconnected' }));
  });

  mcpSocket.on('error', (err) => {
    console.error('MCP connection error:', err);
    mcpSocket = null;
    broadcast(JSON.stringify({ type: 'mcp_status', data: 'Error' }));
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'history', data: commandHistory }));
  ws.send(JSON.stringify({ type: 'processes', data: getProcessList() }));
  ws.send(JSON.stringify({ type: 'mcp_status', data: mcpSocket ? 'Connected' : 'Disconnected' }));

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'command') {
      const command = parsedMessage.data;
      if (command.startsWith('!mcp ')) {
        if (mcpSocket) {
          const mcpCommand = command.substring(5);
          mcpSocket.write(JSON.stringify({ command: mcpCommand }) + '\n');
        } else {
          // Handle case where MCP server is not connected
          const errorOutput = { command, output: 'MCP server not connected', pid: -1 };
          commandHistory.push(errorOutput);
          broadcast(JSON.stringify({ type: 'output', data: errorOutput }));
        }
        return;
      }

      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { shell: true });
      const pid = child.pid;
      processes.set(pid, child);

      const commandOutput = { command, output: '', pid };
      commandHistory.push(commandOutput);

      child.stdout.on('data', (data) => {
        commandOutput.output += data.toString();
        broadcast(JSON.stringify({ type: 'output', data: commandOutput }));
      });

      child.stderr.on('data', (data) => {
        commandOutput.output += data.toString();
        broadcast(JSON.stringify({ type: 'output', data: commandOutput }));
      });

      child.on('close', (code) => {
        commandOutput.output += `\nProcess exited with code ${code}`;
        processes.delete(pid);
        broadcast(JSON.stringify({ type: 'output', data: commandOutput }));
        broadcast(JSON.stringify({ type: 'processes', data: getProcessList() }));
      });

      broadcast(JSON.stringify({ type: 'processes', data: getProcessList() }));
    } else if (parsedMessage.type === 'stop') {
      const pid = parsedMessage.data;
      const process = processes.get(pid);
      if (process) {
        process.kill();
      }
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function getProcessList() {
  return Array.from(processes.keys()).map(pid => ({ pid, command: processes.get(pid).spawnargs.join(' ') }));
}

server.listen(3001, () => {
  console.log('Server is listening on port 3001');
  if (mcpConfig) {
    connectToMcpServer();
  }
});
