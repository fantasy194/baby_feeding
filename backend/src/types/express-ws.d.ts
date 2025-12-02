import * as express from 'express';
import * as WebSocket from 'ws';

declare function expressWs(app: express.Application, server?: any, options?: { leaveRouterUntouched?: boolean }): expressWs.Instance;

declare namespace expressWs {
  interface Instance {
    app: express.Application;
    getWss(): WebSocket.Server;
  }
}

export = expressWs;

declare module 'express-serve-static-core' {
  interface Application {
    ws: (route: string, handler: (ws: WebSocket, req: express.Request) => void) => void;
  }
}
