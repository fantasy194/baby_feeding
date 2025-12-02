import expressWs from 'express-ws';
import { Application, Request } from 'express';
import WebSocket from 'ws';
import { WsMessage } from './models.js';
import { getFrontendStatus } from './scheduler.js';
import logger from './logger.js';

// use loose typing to avoid dependency on upstream type defs
let wss: any = null;

export function initWebsocket(app: Application) {
  wss = expressWs(app);
  app.ws('/ws', (ws: WebSocket, _req: Request) => {
    logger.info('ws client connected');
    ws.send(JSON.stringify({ type: 'status', payload: getFrontendStatus() } as WsMessage));
  });
}

export function broadcastStatus() {
  if (!wss) return;
  const payload = JSON.stringify({ type: 'status', payload: getFrontendStatus() } as WsMessage);
  wss.getWss().clients.forEach((client: WebSocket) => {
    try {
      client.send(payload);
    } catch (e) {
      logger.error({ e }, 'ws send failed');
    }
  });
}
