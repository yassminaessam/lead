import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const permissionsSchema = new mongoose.Schema({
  leads: { type: Boolean, default: true },
  calls: { type: Boolean, default: true },
  reports: { type: Boolean, default: false },
  analytics: { type: Boolean, default: false },
  settings: { type: Boolean, default: false },
  users: { type: Boolean, default: false },
  import_data: { type: Boolean, default: false },
  auto_dial: { type: Boolean, default: true },
  calendar: { type: Boolean, default: true },
  templates: { type: Boolean, default: false },
  data_collection: { type: Boolean, default: false },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'sales', 'manager'], default: 'sales' },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  permissions: { type: permissionsSchema, default: () => ({}) },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
