import cron from 'node-cron';
import Lead from '../models/Lead.js';
import Call from '../models/Call.js';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Settings from '../models/Settings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let scheduledTask = null;

// Create backup
async function createBackup() {
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
      automatic: true,
      data: { leads, calls, meetings, users, activities, settings },
    };

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`✅ Auto backup created: ${filename}`);

    // Clean old backups based on retention
    await cleanOldBackups(settings?.backupRetention || 30);

    return { success: true, filename };
  } catch (err) {
    console.error('❌ Auto backup failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Clean backups older than retention days
async function cleanOldBackups(retentionDays) {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!file.startsWith('backup-')) continue;
    
    const filepath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(filepath);
    
    if (now - stat.mtime.getTime() > maxAge) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
  }
}

// Get cron expression from frequency
function getCronExpression(frequency) {
  switch (frequency) {
    case 'hourly':
      return '0 * * * *'; // Every hour
    case 'daily':
      return '0 2 * * *'; // At 2 AM every day
    case 'weekly':
      return '0 2 * * 0'; // At 2 AM every Sunday
    case 'monthly':
      return '0 2 1 * *'; // At 2 AM on 1st of every month
    default:
      return '0 2 * * *'; // Default: daily
  }
}

// Schedule automatic backups
export async function scheduleBackups() {
  try {
    const settings = await Settings.findOne({ _key: 'main' });
    
    // Stop existing task
    if (scheduledTask) {
      scheduledTask.stop();
      scheduledTask = null;
    }

    if (!settings?.autoBackup) {
      console.log('📦 Auto backup disabled');
      return;
    }

    const cronExpr = getCronExpression(settings.backupFrequency);
    
    scheduledTask = cron.schedule(cronExpr, async () => {
      console.log('⏰ Running scheduled backup...');
      await createBackup();
    });

    console.log(`📦 Auto backup scheduled: ${settings.backupFrequency} (${cronExpr})`);
  } catch (err) {
    console.error('Failed to schedule backups:', err.message);
  }
}

// List available backups
export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(filepath);
      return {
        filename: f,
        size: stat.size,
        created: stat.mtime,
      };
    })
    .sort((a, b) => b.created - a.created);
  
  return files;
}

// Get backup file path
export function getBackupPath(filename) {
  return path.join(BACKUP_DIR, filename);
}

// Manual backup trigger
export { createBackup };
