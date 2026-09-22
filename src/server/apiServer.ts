import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { AutomationEngine } from '../automation/automationEngine.js';

export class ApiServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocketServer;
  private engine: AutomationEngine;
  private port: number;

  constructor(engine: AutomationEngine, port: number = 3100) {
    this.engine = engine;
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Serve static files if UI build exists
    const distUiPath = path.join(process.cwd(), 'dist', 'ui');
    if (fs.existsSync(distUiPath)) {
      this.app.use(express.static(distUiPath));
    }
  }

  private setupRoutes(): void {
    this.app.get('/api/status', (req, res) => {
      res.json(this.engine.getSnapshot());
    });

    this.app.post('/api/start', async (req, res) => {
      try {
        await this.engine.start();
        res.json({ success: true, snapshot: this.engine.getSnapshot() });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    this.app.post('/api/stop', async (req, res) => {
      try {
        await this.engine.stop();
        res.json({ success: true, snapshot: this.engine.getSnapshot() });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    this.app.post('/api/resume', async (req, res) => {
      try {
        await this.engine.resume();
        res.json({ success: true, snapshot: this.engine.getSnapshot() });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    this.app.post('/api/open-linkedin', async (req, res) => {
      try {
        await this.engine.openLinkedInBrowser();
        res.json({ success: true, snapshot: this.engine.getSnapshot() });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    this.app.post('/api/open-coursera', async (req, res) => {
      try {
        await this.engine.openCourseraBrowser();
        res.json({ success: true, snapshot: this.engine.getSnapshot() });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    this.app.post('/api/settings', (req, res) => {
      try {
        const updated = this.engine.updateSettings(req.body);
        res.json({ success: true, settings: updated });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Fallback route for SPA
    this.app.get('*', (req, res, next) => {
      const distIndex = path.join(process.cwd(), 'dist', 'ui', 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        next();
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      // Send initial state on connection
      ws.send(JSON.stringify({ type: 'SNAPSHOT', data: this.engine.getSnapshot() }));

      ws.on('message', async (message: string) => {
        try {
          const payload = JSON.parse(message.toString());
          switch (payload.action) {
            case 'START':
              await this.engine.start();
              break;
            case 'STOP':
              await this.engine.stop();
              break;
            case 'RESUME':
              await this.engine.resume();
              break;
            case 'OPEN_LINKEDIN':
              await this.engine.openLinkedInBrowser();
              break;
            case 'OPEN_COURSERA':
              await this.engine.openCourseraBrowser();
              break;
            case 'UPDATE_SETTINGS':
              this.engine.updateSettings(payload.settings || {});
              break;
          }
        } catch (err) {
          console.error('WebSocket command parse error:', err);
        }
      });
    });

    // Subscribe engine snapshot changes to broadcast to all WebSocket clients
    this.engine.subscribe((snapshot) => {
      const payload = JSON.stringify({ type: 'SNAPSHOT', data: snapshot });
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`\n✨ CoursePilot API & WebSocket Server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close();
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
