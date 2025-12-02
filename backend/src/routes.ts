import { Router } from 'express';
import { ingestLocalEvent, getFrontendStatus } from './scheduler.js';
import { BabyEvent } from './models.js';
import { submitEvent } from './piyologProvider.js';
import { updateSettings } from './state.js';
import logger from './logger.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json(getFrontendStatus());
});

router.post('/events', async (req, res) => {
  const event = req.body as BabyEvent;
  try {
    ingestLocalEvent(event);
    await submitEvent(event);
    res.json({ ok: true });
  } catch (e) {
    logger.error({ e }, 'submit event failed');
    res.status(500).json({ error: 'submit failed' });
  }
});

router.post('/settings', (req, res) => {
  const settings = updateSettings(req.body);
  res.json(settings);
});

export default router;
