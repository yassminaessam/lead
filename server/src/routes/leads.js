import { Router } from 'express';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import { notifyNewLead } from '../services/notifications.js';

const router = Router();

// GET all leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET lead by id
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create lead
router.post('/', async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    
    // Send notification to admins
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        notifyNewLead(lead, admin.email, admin.phone).catch(err => 
          console.error('Failed to notify admin:', err.message)
        );
      }
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }
    
    res.status(201).json(lead);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Lead with this phone already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// POST import leads (bulk)
router.post('/import', async (req, res) => {
  try {
    const { leads: leadsData } = req.body;
    if (!Array.isArray(leadsData)) {
      return res.status(400).json({ error: 'leads must be an array' });
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const created = [];

    for (const data of leadsData) {
      if (!data.company_name || !data.phone) {
        failed++;
        continue;
      }
      try {
        const lead = await Lead.create(data);
        created.push(lead);
        success++;
      } catch (err) {
        if (err.code === 11000) {
          duplicates++;
        } else {
          failed++;
        }
      }
    }

    res.status(201).json({ success, failed, duplicates, leads: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update lead
router.put('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE lead
router.delete('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted', lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
