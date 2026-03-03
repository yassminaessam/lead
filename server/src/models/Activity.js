import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['call', 'lead_created', 'lead_updated', 'lead_deleted', 'meeting', 'email', 'whatsapp', 'note', 'user_created', 'import'], required: true },
  user_id: { type: String, required: true },
  lead_id: { type: String, default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: String, default: () => new Date().toISOString() },
});

activitySchema.index({ timestamp: -1 });

export default mongoose.model('Activity', activitySchema);
