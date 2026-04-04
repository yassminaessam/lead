import { Router } from 'express';
import Lead from '../models/Lead.js';
import Call from '../models/Call.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Settings from '../models/Settings.js';

const router = Router();

// GET backup - Export all data as JSON
router.get('/export', async (req, res) => {
  try {
    const [leads, calls, meetings, users, activities, settings] = await Promise.all([
      Lead.find({}).lean(),
      Call.find({}).lean(),
      Meeting.find({}).lean(),
      User.find({}).lean(),
      Activity.find({}).lean(),
      Settings.findOne({ _key: 'main' }).lean(),
    ]);

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        leads,
        calls,
        meetings,
        users,
        activities,
        settings,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=leadengine-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET export single collection (for MongoDB Compass import)
router.get('/export/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const validCollections = ['leads', 'calls', 'meetings', 'users', 'activities', 'settings'];
    
    if (!validCollections.includes(collection)) {
      return res.status(400).json({ error: `Invalid collection. Valid options: ${validCollections.join(', ')}` });
    }

    let data;
    switch (collection) {
      case 'leads':
        data = await Lead.find({}).lean();
        break;
      case 'calls':
        data = await Call.find({}).lean();
        break;
      case 'meetings':
        data = await Meeting.find({}).lean();
        break;
      case 'users':
        data = await User.find({}).lean();
        break;
      case 'activities':
        data = await Activity.find({}).lean();
        break;
      case 'settings':
        data = await Settings.find({}).lean();
        break;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${collection}-${new Date().toISOString().split('T')[0]}.json`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST restore - Import data from JSON backup
router.post('/restore', async (req, res) => {
  try {
    const { data, options = {} } = req.body;
    const { clearExisting = false } = options;

    if (!data) {
      return res.status(400).json({ error: 'No backup data provided' });
    }

    const results = {
      leads: { inserted: 0, skipped: 0 },
      calls: { inserted: 0, skipped: 0 },
      meetings: { inserted: 0, skipped: 0 },
      users: { inserted: 0, skipped: 0 },
      activities: { inserted: 0, skipped: 0 },
      settings: { restored: false },
    };

    // Clear existing data if requested
    if (clearExisting) {
      await Promise.all([
        Lead.deleteMany({}),
        Call.deleteMany({}),
        Meeting.deleteMany({}),
        Activity.deleteMany({}),
      ]);
    }

    // Restore leads
    if (data.leads && Array.isArray(data.leads)) {
      for (const lead of data.leads) {
        try {
          const existing = await Lead.findById(lead._id);
          if (!existing) {
            await Lead.create(lead);
            results.leads.inserted++;
          } else {
            results.leads.skipped++;
          }
        } catch {
          results.leads.skipped++;
        }
      }
    }

    // Restore calls
    if (data.calls && Array.isArray(data.calls)) {
      for (const call of data.calls) {
        try {
          const existing = await Call.findById(call._id);
          if (!existing) {
            await Call.create(call);
            results.calls.inserted++;
          } else {
            results.calls.skipped++;
          }
        } catch {
          results.calls.skipped++;
        }
      }
    }

    // Restore meetings
    if (data.meetings && Array.isArray(data.meetings)) {
      for (const meeting of data.meetings) {
        try {
          const existing = await Meeting.findById(meeting._id);
          if (!existing) {
            await Meeting.create(meeting);
            results.meetings.inserted++;
          } else {
            results.meetings.skipped++;
          }
        } catch {
          results.meetings.skipped++;
        }
      }
    }

    // Restore users (skip if exists by email)
    if (data.users && Array.isArray(data.users)) {
      for (const user of data.users) {
        try {
          const existing = await User.findOne({ email: user.email });
          if (!existing) {
            await User.create(user);
            results.users.inserted++;
          } else {
            results.users.skipped++;
          }
        } catch {
          results.users.skipped++;
        }
      }
    }

    // Restore activities
    if (data.activities && Array.isArray(data.activities)) {
      for (const activity of data.activities) {
        try {
          const existing = await Activity.findById(activity._id);
          if (!existing) {
            await Activity.create(activity);
            results.activities.inserted++;
          } else {
            results.activities.skipped++;
          }
        } catch {
          results.activities.skipped++;
        }
      }
    }

    // Restore settings
    if (data.settings) {
      const { _id, _key, __v, ...settingsData } = data.settings;
      await Settings.findOneAndUpdate(
        { _key: 'main' },
        settingsData,
        { upsert: true }
      );
      results.settings.restored = true;
    }

    res.json({
      success: true,
      message: 'Backup restored successfully',
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
