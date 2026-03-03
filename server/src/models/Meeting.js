import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  lead_id: { type: String, required: true },
  user_id: { type: String, required: true },
  meeting_date: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
