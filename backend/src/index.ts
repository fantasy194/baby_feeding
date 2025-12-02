import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { HOST, PORT } from './env.js';
import logger from './logger.js';
import router from './routes.js';
import { initWebsocket } from './websocket.js';
import { startScheduler } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
initWebsocket(app);
app.use(cors());
app.use(express.json());
app.use('/api', router);

// serve static frontend if present
const staticDir = path.resolve(__dirname, '../public');
app.use(express.static(staticDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  logger.info({ PORT, HOST }, 'server started');
});

startScheduler();
