import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

interface CommandOutput {
  command: string;
  output: string;
  pid: number;
}

interface Process {
  pid: number;
  command: string;
}

function App() {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [command, setCommand] = useState('');
  const [mcpStatus, setMcpStatus] = useState('Disconnected');
  const terminalEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    socket.on('history', (data: CommandOutput[]) => {
      setHistory(data);
    });

    socket.on('output', (data: CommandOutput) => {
      setHistory((prevHistory) => {
        const existingCommandIndex = prevHistory.findIndex((h) => h.pid === data.pid && h.pid !== -1);
        if (existingCommandIndex !== -1) {
          const newHistory = [...prevHistory];
          newHistory[existingCommandIndex] = data;
          return newHistory;
        }
        return [...prevHistory, data];
      });
    });

    socket.on('processes', (data: Process[]) => {
      setProcesses(data);
    });

    socket.on('mcp_status', (data: string) => {
      setMcpStatus(data);
    });

    socket.on('mcp_response', (data: any) => {
      const response = { command: 'MCP Response', output: JSON.stringify(data, null, 2), pid: -1 };
      setHistory((prevHistory) => [...prevHistory, response]);
    });

    return () => {
      socket.off('history');
      socket.off('output');
      socket.off('processes');
      socket.off('mcp_status');
      socket.off('mcp_response');
    };
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() === '') return;
    socket.emit('command', { type: 'command', data: command });
    setCommand('');
  };

  const handleStopProcess = (pid: number) => {
    socket.emit('stop', { type: 'stop', data: pid });
  };

  const handleMcpConnect = () => {
    socket.emit('mcp_connect', { type: 'mcp_connect' });
  };

  const handleMcpDisconnect = () => {
    socket.emit('mcp_disconnect', { type: 'mcp_disconnect' });
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column bg-dark text-white">
      <div className="row flex-grow-1 pt-3">
        {/* Main Terminal Area */}
        <div className="col-md-8 h-100 d-flex flex-column">
          <div id="terminal" className="flex-grow-1 overflow-auto border border-secondary rounded p-3" style={{ fontFamily: 'monospace' }}>
            {history.map((item, index) => (
              <div key={index}>
                <div>
                  <span className={item.pid === -1 ? "text-warning" : "text-success"}>$</span> {item.command}
                </div>
                <pre className="mb-0 text-muted">{item.output}</pre>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
          <form onSubmit={handleCommandSubmit} className="mt-2">
            <div className="input-group">
              <span className="input-group-text bg-dark text-success border-secondary">$</span>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command (e.g., !mcp get_context)"
                autoFocus
              />
              <button className="btn btn-outline-primary" type="submit">
                Run
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="col-md-4 h-100 d-flex flex-column">
          {/* MCP Server Control */}
          <div className="border border-secondary rounded p-3 mb-3">
            <h4>MCP Server</h4>
            <p>Status: <span className={mcpStatus === 'Connected' ? 'text-success' : 'text-danger'}>{mcpStatus}</span></p>
            <div className="btn-group">
              <button className="btn btn-success" onClick={handleMcpConnect} disabled={mcpStatus === 'Connected'}>
                Connect
              </button>
              <button className="btn btn-danger" onClick={handleMcpDisconnect} disabled={mcpStatus !== 'Connected'}>
                Disconnect
              </button>
            </div>
          </div>

          {/* Running Processes */}
          <div className="flex-grow-1 overflow-auto border border-secondary rounded p-3">
            <h4>Running Processes</h4>
            <ul className="list-group list-group-flush">
              {processes.map((p) => (
                <li key={p.pid} className="list-group-item bg-dark d-flex justify-content-between align-items-center">
                  <span><span className="text-info">{p.pid}</span>: {p.command}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => handleStopProcess(p.pid)}>
                    Stop
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;