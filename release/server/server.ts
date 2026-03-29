import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Safe dirname resolver for both ESM and CJS
// @ts-ignore
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3001;

app.use(express.json());

// Serve static files from the React app
const distPath = path.join(_dirname, '..', 'dist');
app.use(express.static(distPath));

// Enable CORS if needed (for dev)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

let pythonProcess: any = null;
let connectedClients: any[] = [];
let pendingRequests: Map<string, (data: any) => void> = new Map();

const startPythonProcess = () => {
  if (pythonProcess) return;

  const pythonPath = 'python';
  const scriptPath = path.join(_dirname, '..', 'bridge_mt5.py');

  pythonProcess = spawn(pythonPath, [scriptPath]);

  pythonProcess.stdout.on('data', (data: any) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        try {
          const json = JSON.parse(line.trim());
          
          // Handle history response
          if (json.type === 'history') {
             const requestId = `${json.type}_${json.symbol}`;
             const resolve = pendingRequests.get(requestId);
             if (resolve) {
               resolve(json.data);
               pendingRequests.delete(requestId);
             }
          }

          // Handle trade success/error
          if (json.type === 'trade_success' || (json.type === 'error' && json.message.includes('Ordem'))) {
              const resolve = pendingRequests.get('trade');
              if (resolve) {
                resolve(json);
                pendingRequests.delete('trade');
              }
          }

          // Broadcast all messages to connected clients (for logs/status)
          const message = `data: ${JSON.stringify(json)}\n\n`;
          connectedClients.forEach(client => client.write(message));
        } catch (e) {
          // If not JSON, send as raw log
          const message = `data: ${JSON.stringify({ type: 'log', message: line.trim() })}\n\n`;
          connectedClients.forEach(client => client.write(message));
        }
      }
    });
  });

  pythonProcess.stderr.on('data', (data: any) => {
    const message = `data: ${JSON.stringify({ type: 'error', message: data.toString() })}\n\n`;
    connectedClients.forEach(client => client.write(message));
  });

  pythonProcess.on('close', (code: number) => {
    const message = `data: ${JSON.stringify({ type: 'log', message: `Processo encerrado com código ${code}`, status: 'DISCONNECTED' })}\n\n`;
    connectedClients.forEach(client => client.write(message));
    pythonProcess = null;
  });
};

app.get('/api/connect-mt5', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  connectedClients.push(res);

  if (pythonProcess) {
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Bridge already active.' })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ type: 'log', message: 'Attempting to connect to bridge...' })}\n\n`);
    startPythonProcess();
  }

  req.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== res);
  });
});

app.get('/api/history', async (req, res) => {
    const { symbol, timeframe, count } = req.query;
    if (!pythonProcess) return res.status(500).json({ error: 'Bridge not connected' });

    const requestId = `history_${symbol}`;
    const promise = new Promise((resolve) => {
        pendingRequests.set(requestId, resolve);
    });

    pythonProcess.stdin.write(JSON.stringify({ action: 'get_history', symbol, timeframe, count: parseInt(count as string) || 50 }) + '\n');

    const data = await promise;
    res.json(data);
});

app.post('/api/trade', async (req, res) => {
    const tradeData = req.body;
    if (!pythonProcess) return res.status(500).json({ error: 'Bridge not connected' });

    const promise = new Promise((resolve) => {
        pendingRequests.set('trade', resolve);
    });

    pythonProcess.stdin.write(JSON.stringify({ action: 'place_order', ...tradeData }) + '\n');

    const result = await promise;
    res.json(result);
});

app.post('/api/stop-mt5', (req, res) => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    const message = `data: ${JSON.stringify({ type: 'log', message: 'Bridge stopped by user request.', status: 'STOPPED' })}\n\n`;
    connectedClients.forEach(client => client.write(message));
    return res.json({ status: 'STOPPED' });
  }
  res.json({ status: 'NOT_RUNNING' });
});

// Auto-start on boot
startPythonProcess();

app.listen(port, () => {
  console.log(`Bridge Server running at http://localhost:${port}`);
});
