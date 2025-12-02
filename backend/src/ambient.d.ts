declare module 'express-ws' {
  import * as express from 'express';
  import * as WebSocket from 'ws';
  function expressWs(app: express.Application, server?: any, options?: { leaveRouterUntouched?: boolean }): any;
  export = expressWs;
}
