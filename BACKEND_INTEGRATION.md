# دليل ربط LeadEngine CRM Frontend مع Backend

## 📋 نظرة عامة

هذا الدليل يوضح كيفية ربط واجهة LeadEngine CRM المبنية بـ React مع Backend Node.js/Express وMongoDB.

---

## 🏗️ البنية المعمارية

```
┌─────────────────┐
│  React Frontend │ ←→ HTTP/REST API ←→ │ Node.js Backend │ ←→ │  MongoDB  │
│   (Port 5173)   │                     │   (Port 3000)   │     │  (27017)  │
└─────────────────┘                     └─────────────────┘     └───────────┘
                                                ↓
                                        ┌──────────────────┐
                                        │  Android Dialer  │
                                        │  (WiFi/IP:8080)  │
                                        └──────────────────┘
```

---

## 📁 هيكل المشروع المقترح

```
leadengine-crm/
├── frontend/                    # هذا المشروع الحالي (React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Backend Node.js (يحتاج للإنشاء)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # اتصال MongoDB
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Lead.js
│   │   │   ├── Call.js
│   │   │   └── Meeting.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── leads.js
│   │   │   ├── calls.js
│   │   │   ├── users.js
│   │   │   └── android.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
└── android-dialer/              # تطبيق Android (منفصل)
    └── app/
        └── src/
```

---

## 🔧 إعداد Backend

### 1. إنشاء مشروع Node.js

```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install nodemon --save-dev
```

### 2. ملف `.env`

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leadengine
JWT_SECRET=your_secret_key_here
ANDROID_DIALER_IP=192.168.1.100
ANDROID_DIALER_PORT=8080
```

### 3. MongoDB Models

#### User Model (`models/User.js`)

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'sales', 'manager'], default: 'sales' },
  phone: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

#### Lead Model (`models/Lead.js`)

```javascript
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  website: String,
  industry: { type: String, required: true },
  city: { type: String, required: true },
  source: { 
    type: String, 
    enum: ['osm', 'apify', 'phantombuster', 'manual', 'linkedin'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['new', 'contacted', 'followup', 'meeting', 'closed', 'lost'],
    default: 'new' 
  },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
```

#### Call Model (`models/Call.js`)

```javascript
const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  lead_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  result: { 
    type: String, 
    enum: ['answered', 'no_answer', 'busy', 'rejected', 'voicemail'],
    required: true 
  },
  duration: { type: Number, default: 0 }, // in seconds
  notes: String,
  next_followup: Date,
}, { timestamps: true });

module.exports = mongoose.model('Call', callSchema);
```

---

## 🌐 API Endpoints

### Authentication APIs

#### 1. تسجيل الدخول
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "JWT_TOKEN",
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "role": "sales"
  }
}
```

### Leads APIs

#### 1. جلب جميع العملاء المحتملين
```http
GET /api/leads
Authorization: Bearer JWT_TOKEN
Query Parameters:
  - status (optional): new, contacted, followup, meeting, closed, lost
  - industry (optional): مقاولات, عيادات, سياحة
  - source (optional): osm, apify, manual, etc.
  - assigned_to (optional): user_id
  - page (optional): 1
  - limit (optional): 20

Response:
{
  "leads": [...],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

#### 2. إنشاء عميل محتمل جديد
```http
POST /api/leads
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "company_name": "شركة المثال",
  "phone": "0123456789",
  "email": "info@example.com",
  "industry": "مقاولات",
  "city": "القاهرة",
  "source": "manual",
  "assigned_to": "user_id"
}
```

#### 3. تحديث عميل محتمل
```http
PUT /api/leads/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "status": "contacted",
  "notes": "ملاحظات جديدة"
}
```

#### 4. حذف عميل محتمل
```http
DELETE /api/leads/:id
Authorization: Bearer JWT_TOKEN
```

### Calls APIs

#### 1. جلب جميع المكالمات
```http
GET /api/calls
Authorization: Bearer JWT_TOKEN
Query Parameters:
  - lead_id (optional)
  - user_id (optional)
  - result (optional): answered, no_answer, busy, rejected
  - date_from (optional): 2026-02-01
  - date_to (optional): 2026-02-28
```

#### 2. تسجيل مكالمة جديدة
```http
POST /api/calls
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "lead_id": "lead_id",
  "result": "answered",
  "duration": 180,
  "notes": "العميل مهتم",
  "next_followup": "2026-03-01T10:00:00Z"
}
```

### Android Dialer APIs

#### 1. إرسال أمر اتصال
```http
POST /api/android/call
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "phone": "0123456789",
  "lead_id": "lead_id"
}

Response:
{
  "success": true,
  "message": "Call initiated"
}
```

#### 2. استقبال نتيجة المكالمة من Android
```http
POST /api/android/call-result
Content-Type: application/json

{
  "phone": "0123456789",
  "duration": 120,
  "status": "answered"
}
```

---

## 🔗 ربط Frontend مع Backend

### 1. إنشاء API Service

أنشئ ملف `/src/app/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (data: any) => 
    api.post('/auth/register', data),
};

// Leads API
export const leadsAPI = {
  getAll: (params?: any) => 
    api.get('/leads', { params }),
  
  getById: (id: string) => 
    api.get(`/leads/${id}`),
  
  create: (data: any) => 
    api.post('/leads', data),
  
  update: (id: string, data: any) => 
    api.put(`/leads/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/leads/${id}`),
  
  importCSV: (file: FormData) => 
    api.post('/leads/import', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Calls API
export const callsAPI = {
  getAll: (params?: any) => 
    api.get('/calls', { params }),
  
  create: (data: any) => 
    api.post('/calls', data),
  
  initiateCall: (phone: string, lead_id: string) => 
    api.post('/android/call', { phone, lead_id }),
};

// Users API
export const usersAPI = {
  getAll: () => 
    api.get('/users'),
  
  create: (data: any) => 
    api.post('/users', data),
  
  update: (id: string, data: any) => 
    api.put(`/users/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/users/${id}`),
};

export default api;
```

### 2. تحديث AuthContext لاستخدام API

```typescript
// في /src/app/contexts/AuthContext.tsx
import { authAPI } from '../services/api';

const login = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsAuthenticated(true);
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

### 3. استخدام API في الصفحات

مثال - LeadsPage:

```typescript
import { useEffect, useState } from 'react';
import { leadsAPI } from '../services/api';
import { Lead } from '../types';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.getAll();
      setLeads(response.data.leads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## 📱 Android Dialer Integration

### 1. Android App Setup

بناء تطبيق Android بسيط يعمل كـ Web Server:

```kotlin
// MainActivity.kt
class MainActivity : AppCompatActivity() {
    private lateinit var server: LocalServer
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Start local server
        server = LocalServer(8080)
        server.start()
    }
}

// LocalServer.kt
class LocalServer(private val port: Int) {
    fun start() {
        Thread {
            val server = ServerSocket(port)
            while (true) {
                val client = server.accept()
                handleClient(client)
            }
        }.start()
    }
    
    private fun handleClient(client: Socket) {
        val input = client.getInputStream().bufferedReader()
        val output = client.getOutputStream()
        
        val request = input.readLine()
        
        if (request.contains("POST /call")) {
            // Parse JSON body to get phone number
            val phoneNumber = parsePhoneNumber(input)
            
            // Make call
            makeCall(phoneNumber)
            
            // Send response
            val response = "HTTP/1.1 200 OK\r\n\r\n{\"success\":true}"
            output.write(response.toByteArray())
        }
        
        client.close()
    }
    
    private fun makeCall(phoneNumber: String) {
        val intent = Intent(Intent.ACTION_CALL)
        intent.data = Uri.parse("tel:$phoneNumber")
        startActivity(intent)
    }
}
```

### 2. Call Result Listener

```kotlin
// CallReceiver.kt
class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            
            when (state) {
                TelephonyManager.EXTRA_STATE_IDLE -> {
                    // Call ended - send result to backend
                    sendCallResult(phoneNumber, duration, "answered")
                }
            }
        }
    }
    
    private fun sendCallResult(phone: String, duration: Int, status: String) {
        val client = OkHttpClient()
        val json = JSONObject()
        json.put("phone", phone)
        json.put("duration", duration)
        json.put("status", status)
        
        val body = RequestBody.create(
            "application/json".toMediaType(),
            json.toString()
        )
        
        val request = Request.Builder()
            .url("http://YOUR_BACKEND_IP:3000/api/android/call-result")
            .post(body)
            .build()
        
        client.newCall(request).execute()
    }
}
```

---

## 🔐 Authentication & Security

### 1. JWT Middleware (Backend)

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2. CORS Configuration

```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

---

## 📊 Database Indexing

```javascript
// في models بعد تعريف Schema
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assigned_to: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });

callSchema.index({ lead_id: 1 });
callSchema.index({ user_id: 1 });
callSchema.index({ createdAt: -1 });
```

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render/DigitalOcean)

```bash
# في backend/
npm start
```

### MongoDB (MongoDB Atlas)

استخدم MongoDB Atlas للـ cloud database:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leadengine
```

---

## 📝 Environment Variables

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

### Backend (`.env`)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/leadengine
JWT_SECRET=your_very_secret_key_change_in_production
ANDROID_DIALER_IP=192.168.1.100
ANDROID_DIALER_PORT=8080
```

---

## 🧪 Testing

### Test API Endpoints

استخدم Postman أو Thunder Client:

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test get leads
curl -X GET http://localhost:3000/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 Support

للمساعدة في ربط Backend، راجع:
- Express Documentation: https://expressjs.com
- Mongoose Documentation: https://mongoosejs.com
- JWT Documentation: https://jwt.io

---

**ملاحظة مهمة**: هذا دليل للبدء. يجب عليك إضافة:
- التحقق من صحة البيانات (validation)
- معالجة الأخطاء (error handling)
- Rate limiting
- Logging
- Security headers
- Testing (Jest/Mocha)
