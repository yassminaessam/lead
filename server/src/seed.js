import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import User from './models/User.js';
import Lead from './models/Lead.js';
import Call from './models/Call.js';
import Meeting from './models/Meeting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadengine';

const users = [
  { name: 'أحمد محمد', email: 'ahmed@leadengine.com', role: 'admin', phone: '01012345678', password: '123456', isActive: true, permissions: { leads: true, calls: true, reports: true, analytics: true, settings: true, users: true, import_data: true, auto_dial: true, calendar: true, templates: true, data_collection: true } },
  { name: 'سارة علي', email: 'sarah@leadengine.com', role: 'sales', phone: '01023456789', password: '123456', isActive: true, permissions: { leads: true, calls: true, reports: false, analytics: false, settings: false, users: false, import_data: false, auto_dial: true, calendar: true, templates: false, data_collection: false } },
  { name: 'محمود حسن', email: 'mahmoud@leadengine.com', role: 'sales', phone: '01034567890', password: '123456', isActive: true, permissions: { leads: true, calls: true, reports: false, analytics: false, settings: false, users: false, import_data: false, auto_dial: true, calendar: true, templates: false, data_collection: false } },
  { name: 'فاطمة خالد', email: 'fatma@leadengine.com', role: 'manager', phone: '01045678901', password: '123456', isActive: true, permissions: { leads: true, calls: true, reports: true, analytics: true, settings: false, users: false, import_data: true, auto_dial: true, calendar: true, templates: true, data_collection: true } },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Call.deleteMany({}),
    Meeting.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Seed users (use save() to trigger pre-save password hashing)
  const createdUsers = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} users`);

  const sarah = createdUsers.find(u => u.email === 'sarah@leadengine.com');
  const mahmoud = createdUsers.find(u => u.email === 'mahmoud@leadengine.com');

  // Seed leads
  const leads = [
    { company_name: 'شركة المقاولات العربية', phone: '0224567890', email: 'info@arabianconstruction.com', website: 'https://arabianconstruction.com', industry: 'مقاولات', city: 'القاهرة', source: 'gmaps', status: 'contacted', assigned_to: sarah._id.toString(), notes: 'مهتمين بخدمات CRM' },
    { company_name: 'عيادة النور الطبية', phone: '0223334444', email: 'contact@alnourclinic.com', industry: 'عيادات', city: 'الجيزة', source: 'manual', status: 'meeting', assigned_to: sarah._id.toString(), notes: 'موعد اجتماع يوم الأحد' },
    { company_name: 'شركة السياحة المصرية', phone: '0225556666', email: 'info@egypttourism.com', website: 'https://egypttourism.com', industry: 'سياحة', city: 'الإسكندرية', source: 'gmaps', status: 'followup', assigned_to: mahmoud._id.toString(), notes: 'طلبوا عرض سعر' },
    { company_name: 'مستشفى الشفاء', phone: '0227778888', industry: 'عيادات', city: 'القاهرة', source: 'phantombuster', status: 'new', assigned_to: sarah._id.toString() },
    { company_name: 'شركة البناء الحديث', phone: '0229990000', email: 'modern@construction.com', industry: 'مقاولات', city: 'الجيزة', source: 'linkedin', status: 'closed', assigned_to: mahmoud._id.toString(), notes: 'تم التعاقد بنجاح' },
    { company_name: 'رحلات النيل السياحية', phone: '0221112222', industry: 'سياحة', city: 'الأقصر', source: 'gmaps', status: 'lost', assigned_to: mahmoud._id.toString(), notes: 'غير مهتمين حالياً' },
    { company_name: 'مركز الأسنان المتطور', phone: '0223334455', email: 'dental@center.com', industry: 'عيادات', city: 'القاهرة', source: 'manual', status: 'contacted', assigned_to: sarah._id.toString() },
    { company_name: 'شركة التشييد الذهبية', phone: '0225557777', industry: 'مقاولات', city: 'الإسكندرية', source: 'gmaps', status: 'followup', assigned_to: mahmoud._id.toString() },
  ];

  const createdLeads = await Lead.insertMany(leads);
  console.log(`Created ${createdLeads.length} leads`);

  // Seed calls
  const callsData = [
    { lead_id: createdLeads[0]._id.toString(), user_id: sarah._id.toString(), result: 'answered', duration: 180, notes: 'مهتمين بالمنتج، سيفكروا ويردون', next_followup: '2026-02-28T10:00:00Z', created_at: '2026-02-25T14:30:00Z' },
    { lead_id: createdLeads[1]._id.toString(), user_id: sarah._id.toString(), result: 'answered', duration: 240, notes: 'تم تحديد موعد اجتماع', created_at: '2026-02-26T10:00:00Z' },
    { lead_id: createdLeads[2]._id.toString(), user_id: mahmoud._id.toString(), result: 'no_answer', duration: 0, notes: 'لم يرد، سأحاول مرة أخرى', next_followup: '2026-02-27T11:00:00Z', created_at: '2026-02-26T09:00:00Z' },
    { lead_id: createdLeads[4]._id.toString(), user_id: mahmoud._id.toString(), result: 'answered', duration: 420, notes: 'اتفقنا على جميع التفاصيل', created_at: '2026-02-24T16:00:00Z' },
    { lead_id: createdLeads[6]._id.toString(), user_id: sarah._id.toString(), result: 'answered', duration: 120, notes: 'طلبوا مزيد من المعلومات', next_followup: '2026-02-27T14:00:00Z', created_at: '2026-02-26T11:00:00Z' },
    { lead_id: createdLeads[7]._id.toString(), user_id: mahmoud._id.toString(), result: 'busy', duration: 0, notes: 'الخط مشغول', next_followup: '2026-02-27T10:00:00Z', created_at: '2026-02-26T10:30:00Z' },
  ];

  const createdCalls = await Call.insertMany(callsData);
  console.log(`Created ${createdCalls.length} calls`);

  // Seed meetings
  const meetingsData = [
    { lead_id: createdLeads[1]._id.toString(), user_id: sarah._id.toString(), meeting_date: '2026-03-02T14:00:00Z', notes: 'مناقشة تفاصيل العقد', status: 'scheduled' },
    { lead_id: createdLeads[4]._id.toString(), user_id: mahmoud._id.toString(), meeting_date: '2026-02-24T13:00:00Z', notes: 'توقيع العقد', status: 'completed' },
  ];

  const createdMeetings = await Meeting.insertMany(meetingsData);
  console.log(`Created ${createdMeetings.length} meetings`);

  console.log('\n✅ Seed complete! You can now log in with:');
  console.log('  ahmed@leadengine.com (admin)');
  console.log('  sarah@leadengine.com (sales)');
  console.log('  mahmoud@leadengine.com (sales)');
  console.log('  fatma@leadengine.com (manager)');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
