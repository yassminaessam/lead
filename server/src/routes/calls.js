import { Router } from 'express';
import Call from '../models/Call.js';

const router = Router();

// GET all calls
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.lead_id) filter.lead_id = req.query.lead_id;
    if (req.query.user_id) filter.user_id = req.query.user_id;
    const calls = await Call.find(filter).sort({ created_at: -1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create call
router.post('/', async (req, res) => {
  try {
    const call = await Call.create(req.body);
    res.status(201).json(call);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST — proxy call request to Android device
// Tries Socket.IO signaling first (if device connected via Voice Bridge),
// then falls back to direct HTTP to the device.
router.post('/android/dial', async (req, res) => {
  const { phone, deviceIP, devicePort, timeout, apiKey } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'phone is required' });
  }

  // --- Try Socket.IO signaling first ---
  const dialDevice = req.app.get('dialDevice');
  if (dialDevice) {
    try {
      const result = await dialDevice(phone);
      return res.json({ success: true, via: 'signaling', ...result });
    } catch (sigErr) {
      console.log(`[Calls] Signaling dial failed: ${sigErr.message}, trying HTTP...`);
      // Fall through to HTTP
    }
  }

  // --- Fall back to HTTP ---
  if (!deviceIP) {
    return res.status(400).json({ error: 'No device connected via Voice Bridge, and no deviceIP configured for HTTP fallback' });
  }

  const port = devicePort || '8080';
  const callTimeout = (timeout || 10) * 1000;
  const url = `http://${deviceIP}:${port}/call`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), callTimeout);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Android device error: ${response.status}`, details: text });
    }

    const data = await response.json().catch(() => ({ status: 'ok' }));
    res.json({ success: true, ...data });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Android device did not respond (timeout)' });
    }
    res.status(502).json({ error: `Cannot reach Android device at ${deviceIP}:${port}`, details: err.message });
  }
});

// POST — test connection to Android device
router.post('/android/test', async (req, res) => {
  const { deviceIP, devicePort, apiKey } = req.body;
  if (!deviceIP) {
    return res.status(400).json({ error: 'deviceIP is required' });
  }

  const port = devicePort || '8080';
  const url = `http://${deviceIP}:${port}/status`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const headers = {};
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      res.json({ connected: true, ...data });
    } else {
      res.json({ connected: false, error: `Device responded with status ${response.status}` });
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.json({ connected: false, error: 'Device did not respond (timeout)' });
    }
    res.json({ connected: false, error: err.message });
  }
});

export default router;
