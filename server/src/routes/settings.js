import { Router } from 'express';
import Settings from '../models/Settings.js';

const router = Router();

// GET settings (singleton)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ _key: 'main' });
    if (!settings) {
      settings = await Settings.create({ _key: 'main' });
    }
    const obj = settings.toObject();
    delete obj._id;
    delete obj._key;
    delete obj.__v;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update settings (upsert)
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { _key: 'main' },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
