# LeadEngine CRM - Frontend Dashboard

## 📱 نظرة عامة

Dashboard احترافي لنظام LeadEngine CRM مع دعم كامل للغة العربية (RTL).

## 🎯 الميزات المتاحة

### ✅ الصفحات
- **تسجيل الدخول**: نظام مصادقة مع حسابات تجريبية
- **لوحة التحكم**: إحصائيات شاملة مع Charts تفاعلية
- **العملاء المحتملين**: جدول مع filters، search، وexport CSV
- **تفاصيل العميل**: صفحة تفصيلية مع سجل المكالمات
- **المكالمات**: سجل كامل لجميع المكالمات
- **التقويم**: جدول المتابعات والاجتماعات
- **التقارير**: تحليلات وإحصائيات متقدمة
- **المستخدمين**: إدارة الفريق (Admin فقط)

### ✅ المكونات
- Call Modal مع ربط Android
- Add Lead Modal
- نظام Filters متقدم
- RTL Support كامل
- Responsive Design

## 🔌 ربط Backend API

حالياً النظام يعمل بـ **Mock Data**. للربط بـ Backend حقيقي:

### 1️⃣ Authentication

```typescript
// في: /src/app/contexts/AuthContext.tsx
const login = async (email: string, password: string) => {
  // استبدل هذا:
  const response = await fetch('http://your-backend.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    setUser(data.user);
    localStorage.setItem('leadengine_token', data.token);
    return true;
  }
  return false;
};
```

### 2️⃣ Leads API

```typescript
// GET /api/leads - جلب جميع العملاء
// POST /api/leads - إضافة عميل جديد
// PUT /api/leads/:id - تحديث عميل
// DELETE /api/leads/:id - حذف عميل

// مثال في LeadsPage.tsx:
const fetchLeads = async () => {
  const response = await fetch('http://your-backend.com/api/leads', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('leadengine_token')}`
    }
  });
  const data = await response.json();
  setLeads(data);
};
```

### 3️⃣ Calls API

```typescript
// POST /api/calls - تسجيل مكالمة
// GET /api/calls - جلب سجل المكالمات
// GET /api/calls/lead/:leadId - مكالمات عميل محدد

// مثال في CallModal.tsx:
const handleSave = async () => {
  await fetch('http://your-backend.com/api/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lead_id,
      user_id,
      result,
      notes,
      next_followup
    })
  });
};
```

## 📱 ربط Android Dialer

### Architecture

```
React Dashboard → Backend API → Android Device → WE SIM Call
```

### 1️⃣ عند الضغط على "اتصل الآن"

```typescript
// في: /src/app/components/CallModal.tsx
const handleCall = async () => {
  // أرسل طلب للـ Backend
  await fetch('http://your-backend.com/api/android/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: lead.phone,
      lead_id: lead._id
    })
  });
};
```

### 2️⃣ Backend يرسل للـ Android

```javascript
// Node.js Backend Example
app.post('/api/android/call', async (req, res) => {
  const { phone, lead_id } = req.body;
  
  // أرسل للجهاز Android (مثال: 192.168.1.50:8080)
  await axios.post('http://192.168.1.50:8080/call', {
    number: phone
  });
  
  res.json({ success: true });
});
```

### 3️⃣ Android App يستقبل ويتصل

```kotlin
// Android: Simple Web Server
@POST("/call")
fun makeCall(@Body request: CallRequest) {
    val intent = Intent(Intent.ACTION_CALL)
    intent.data = Uri.parse("tel:${request.number}")
    startActivity(intent)
    
    // بعد انتهاء المكالمة، أرسل النتيجة:
    sendCallResult(request.number, duration, status)
}

fun sendCallResult(number: String, duration: Int, status: String) {
    // أرسل للـ Backend
    api.post("/api/calls/result") {
        body = CallResult(number, duration, status)
    }
}
```

## 🗄️ MongoDB Schema

```javascript
// Users Collection
{
  _id: ObjectId,
  name: String,
  email: String,
  role: 'admin' | 'sales' | 'manager',
  phone: String,
  createdAt: Date
}

// Leads Collection
{
  _id: ObjectId,
  company_name: String,
  phone: String,
  email: String,
  website: String,
  industry: String,
  city: String,
  source: 'osm' | 'apify' | 'phantombuster' | 'manual' | 'linkedin',
  status: 'new' | 'contacted' | 'followup' | 'meeting' | 'closed' | 'lost',
  assigned_to: ObjectId, // User ID
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// Calls Collection
{
  _id: ObjectId,
  lead_id: ObjectId,
  user_id: ObjectId,
  result: 'answered' | 'no_answer' | 'busy' | 'rejected' | 'voicemail',
  duration: Number, // seconds
  notes: String,
  next_followup: Date,
  created_at: Date
}

// Meetings Collection
{
  _id: ObjectId,
  lead_id: ObjectId,
  user_id: ObjectId,
  meeting_date: Date,
  notes: String,
  status: 'scheduled' | 'completed' | 'cancelled',
  createdAt: Date
}
```

## 🚀 Data Collection Scripts

### OpenStreetMap Script (Node.js)

```javascript
const axios = require('axios');

async function scrapeOSM(city, industry) {
  // Overpass API Query
  const query = `
    [out:json];
    area["name"="${city}"]->.searchArea;
    (
      node["amenity"="clinic"](area.searchArea);
      way["amenity"="clinic"](area.searchArea);
    );
    out body;
  `;
  
  const response = await axios.post(
    'https://overpass-api.de/api/interpreter',
    query
  );
  
  // حفظ في MongoDB
  const leads = response.data.elements.map(el => ({
    company_name: el.tags.name,
    city: city,
    industry: industry,
    source: 'osm',
    status: 'new',
    createdAt: new Date()
  }));
  
  await Lead.insertMany(leads);
}
```

### CSV Import من Apify/PhantomBuster

```javascript
const csv = require('csv-parser');
const fs = require('fs');

function importCSV(filePath) {
  const leads = [];
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      leads.push({
        company_name: row['Company Name'],
        phone: row['Phone'],
        email: row['Email'],
        website: row['Website'],
        industry: row['Industry'],
        city: row['City'],
        source: 'apify',
        status: 'new',
        createdAt: new Date()
      });
    })
    .on('end', async () => {
      await Lead.insertMany(leads);
      console.log(`Imported ${leads.length} leads`);
    });
}
```

## 📊 Analytics Endpoints

```javascript
// Backend API Endpoints للتقارير
GET /api/analytics/overview
GET /api/analytics/sales-performance
GET /api/analytics/conversion-funnel
GET /api/analytics/industry-performance
```

## 🔐 Authentication & Authorization

```javascript
// Middleware للتحقق من الصلاحيات
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// مثال:
app.delete('/api/leads/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  deleteLeadController
);
```

## 📝 ملاحظات مهمة

1. **Mock Data**: جميع البيانات حالياً mock، يجب ربطها بـ Backend حقيقي
2. **Android Integration**: يحتاج إلى Android app منفصل
3. **Environment Variables**: استخدم `.env` لـ API URLs
4. **CORS**: تأكد من تفعيل CORS في Backend
5. **Security**: لا تستخدم للبيانات الحساسة بدون أمان إضافي

## 🎨 Customization

- الألوان: `/src/styles/theme.css`
- الخطوط: `/src/styles/fonts.css`
- المكونات: `/src/app/components/`

## 🧪 حسابات تجريبية

```
Admin: ahmed@leadengine.com
Sales: sarah@leadengine.com
Manager: fatma@leadengine.com
Password: أي كلمة مرور (mock authentication)
```

## 📞 الخطوات التالية

1. ✅ بناء Backend (Node.js + Express + MongoDB)
2. ✅ إنشاء Android Dialer App
3. ✅ ربط APIs بالـ Frontend
4. ✅ إعداد OpenStreetMap scraping
5. ✅ تكامل Apify/PhantomBuster
6. ✅ Deploy Backend على Cloud
7. ✅ تشغيل Android device على شبكة ثابتة
