import { Router } from 'express';
import Meeting from '../models/Meeting.js';

const router = Router();

// GET all meetings
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.lead_id) filter.lead_id = req.query.lead_id;
    if (req.query.user_id) filter.user_id = req.query.user_id;
    const meetings = await Meeting.find(filter).sort({ meeting_date: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create meeting
router.post('/', async (req, res) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json(meeting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update meeting
router.put('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE meeting
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
