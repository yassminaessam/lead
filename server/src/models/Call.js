import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  lead_id: { type: String, required: true },
  user_id: { type: String, required: true },
  result: { type: String, enum: ['answered', 'no_answer', 'busy', 'rejected', 'voicemail'], required: true },
  duration: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  next_followup: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() },
});

export default mongoose.model('Call', callSchema);
