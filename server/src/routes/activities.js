import { Router } from 'express';
import Activity from '../models/Activity.js';

const router = Router();

// GET all activities (sorted by timestamp desc)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.user_id) filter.user_id = req.query.user_id;
    if (req.query.lead_id) filter.lead_id = req.query.lead_id;
    if (req.query.type) filter.type = req.query.type;

    const limit = parseInt(req.query.limit) || 100;
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create activity
router.post('/', async (req, res) => {
  try {
    const activity = await Activity.create(req.body);
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
