# Gemini-CLI-UI-with-MCP-Server-Config
-----------------------------------------
a Friendly UI for Gemini CLI - That have the ability to connect to MCP Tools &amp; Serveses via Local Server - using a config JSON files
-------------------------------------------------------------------------------------------------------------------------------------------
# Gemini CLI UI

A web-based user interface for your command line, providing a friendly and powerful way to run shell commands, manage processes, and connect to a Model Context Protocol (MCP) server.

This application provides a dual-panel interface featuring a real-time terminal for executing commands and a sidebar for monitoring running processes and managing the connection to an MCP server.
------------------------------------------------------------------------------------------------------------------
## Features
-----------
- **Web-Based Interface**: Access your shell from a clean, modern web UI.
- **Real-Time Output**: Command output is streamed to the UI in real-time.
- **Command History**: A persistent, scrollable history of all commands and their output.
- **Process Management**: View a list of all running background processes and stop them with a single click.
- **MCP Server Integration**: Connect to a local MCP server to send commands and receive context.
- **Configurable**: MCP server connection settings are stored in a simple `config.json` file.
- **Shell Mode**: A familiar, single-pane terminal layout for a classic shell experience.
--------------------------------------------------------------------------------------------------------------------------------------------
## Architecture
---------------
- **Backend**: A Node.js server using Express.js for serving the UI and `ws` for WebSocket communication. It spawns shell commands as child processes and connects to the MCP server via a TCP socket.
- **Frontend**: A React application built with TypeScript and styled with Bootstrap. It communicates with the backend in real-time using WebSockets.
-----------------------------------------------------------------------------------------------------------------------------------------------
## Prerequisites
---------------
Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (which includes npm)

## Installation & Setup
--------------------------
1.  **Navigate to the project directory**:
    ```bash
    cd gemini-cli-ui
    ```

2.  **Install backend dependencies**:
    ```bash
    npm install
    ```

3.  **Install frontend dependencies**:
    ```bash
    cd client
    npm install
    cd ..
    ```

## Configuration
-------------------
The application can be configured to connect to your local MCP server by editing the `config.json` file in the root of the project directory.

```json
{
  "mcp_server": {
    "connection_type": "tcp",
    "host": "localhost",
    "port": 8080,
    "data_format": "json",
    "termination": "newline"
  }
}
```

- `host`: The hostname or IP address of your MCP server.
- `port`: The port number your MCP server is listening on.

## Running the Application
----------------------------
To start both the backend server and the frontend development server concurrently, run the following command from the project's root directory (`gemini-cli-ui`):

```bash
npm start
```

Once the application is running, open your web browser and navigate to:

[http://localhost:3000](http://localhost:3000)
---------------------------------------------------------------------------------------------------------------------------------------------------------
## How to Use

### Running Shell Commands
--------------------------
Simply type any shell command into the input field at the bottom of the terminal and press Enter or click the "Run" button. The output will appear in the terminal above.

**Example**: `ls -l`, `ping google.com`

### Managing Processes
------------------------
The "Running Processes" sidebar on the right lists all the processes that have been started in the background. To terminate a process, simply click the "Stop" button next to its name.

### Connecting to the MCP Server
--------------------------------------
The "MCP Server" panel in the sidebar shows the current connection status.

- **Connect/Disconnect**: Use the "Connect" and "Disconnect" buttons to manually manage the connection.
- **Sending Commands**: To send a command to the MCP server, prefix it with `!mcp ` in the command input field.

  **Example**: `!mcp get_context`

- **Receiving Responses**: Responses from the MCP server will be displayed in the main terminal window, highlighted for clarity.

## Project Structure
---------------------
```
gemini-cli-ui/
├── client/              # React frontend application
│   ├── public/
│   └── src/
│       └── App.tsx      # Main UI component
├── node_modules/
├── server.js            # Backend Node.js server
├── package.json         # Project scripts and dependencies
├── config.json          # MCP server configuration
└── README.md            # This documentation file
```
