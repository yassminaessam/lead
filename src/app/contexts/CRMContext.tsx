import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { User, Lead, Call, Meeting, defaultPermissions } from '../types';

// Activity tracking
export interface Activity {
  _id?: string;
  id: string;
  type: 'call' | 'lead_created' | 'lead_updated' | 'lead_deleted' | 'meeting' | 'email' | 'whatsapp' | 'note' | 'user_created' | 'import';
  user_id: string;
  lead_id?: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Settings
export interface CRMSettings {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  timezone: string;
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  desktopNotifications: boolean;
  notifyNewLead: boolean;
  notifyMissedCall: boolean;
  notifyFollowUp: boolean;
  // Android
  androidDeviceIP: string;
  androidDevicePort: string;
  androidApiKey: string;
  autoRetry: boolean;
  retryAttempts: number;
  callTimeout: number;
  // Database
  mongodbUri: string;
  autoBackup: boolean;
  backupFrequency: string;
  backupRetention: number;
  // Email
  smtpHost: string;
  smtpPort: string;
  smtpEmail: string;
  smtpPassword: string;
  emailSignature: string;
  // WhatsApp
  whatsappEnabled: boolean;
  whatsappApiKey: string;
  whatsappPhoneNumber: string;
  whatsappTemplate: string;
  // APIs
  phantombusterApiKey: string;
  openaiApiKey: string;
}

const defaultSettings: CRMSettings = {
  companyName: 'LeadEngine CRM',
  companyPhone: '01012345678',
  companyEmail: 'info@leadengine.com',
  timezone: 'Africa/Cairo',
  emailNotifications: true,
  smsNotifications: false,
  desktopNotifications: true,
  notifyNewLead: true,
  notifyMissedCall: true,
  notifyFollowUp: true,
  androidDeviceIP: '127.0.0.1',
  androidDevicePort: '8080',
  androidApiKey: '',
  autoRetry: true,
  retryAttempts: 3,
  callTimeout: 30,
  mongodbUri: 'mongodb://localhost:27017/leadengine',
  autoBackup: true,
  backupFrequency: 'daily',
  backupRetention: 30,
  smtpHost: 'smtp.gmail.com',
  smtpPort: '587',
  smtpEmail: '',
  smtpPassword: '',
  emailSignature: 'مع تحياتنا،\nفريق LeadEngine',
  whatsappEnabled: false,
  whatsappApiKey: '',
  whatsappPhoneNumber: '',
  whatsappTemplate: 'مرحباً {name}، شكراً لاهتمامك بخدماتنا.',
  phantombusterApiKey: '',
  openaiApiKey: '',
};

interface CRMContextType {
  // Data
  leads: Lead[];
  calls: Call[];
  meetings: Meeting[];
  users: User[];
  activities: Activity[];
  settings: CRMSettings;
  loading: boolean;

  // Lead operations
  addLead: (lead: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>, userId?: string) => Lead;
  updateLead: (id: string, updates: Partial<Lead>, userId?: string) => void;
  deleteLead: (id: string, userId?: string) => void;
  importLeads: (leads: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>[], userId?: string) => Promise<{ success: number; failed: number; duplicates: number }>;
  getLeadById: (id: string) => Lead | undefined;

  // Call operations
  addCall: (call: Omit<Call, '_id'>, userId?: string) => Call;
  getCallsForLead: (leadId: string) => Call[];

  // Meeting operations
  addMeeting: (meeting: Omit<Meeting, '_id' | 'createdAt'>, userId?: string) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;

  // User operations
  addUser: (user: Omit<User, '_id' | 'createdAt'> & { password: string }) => User;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => void;
  deleteUser: (id: string) => void;

  // Activity operations
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;

  // Settings operations
  updateSettings: (updates: Partial<CRMSettings>) => void;

  // Stats
  getStats: () => {
    totalLeads: number;
    totalCalls: number;
    answeredCalls: number;
    contactRate: number;
    conversionRate: number;
    closedLeads: number;
    avgCallDuration: number;
    totalDuration: number;
  };
}

// API helper
const API_BASE = '/api';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Normalize MongoDB _id for activities (API returns _id, frontend uses id)
function normalizeActivity(a: Record<string, unknown>): Activity {
  return { ...a, id: (a._id as string) || (a.id as string) } as Activity;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<CRMSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Fetch all data from API on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function fetchAll() {
      try {
        const [leadsData, callsData, meetingsData, usersData, activitiesData, settingsData] = await Promise.all([
          api<Lead[]>('/leads'),
          api<Call[]>('/calls'),
          api<Meeting[]>('/meetings'),
          api<User[]>('/users'),
          api<Activity[]>('/activities'),
          api<CRMSettings>('/settings'),
        ]);
        setLeads(leadsData);
        setCalls(callsData);
        setMeetings(meetingsData);
        setUsers(usersData);
        setActivities(activitiesData.map(a => normalizeActivity(a as unknown as Record<string, unknown>)));
        setSettings(prev => ({ ...prev, ...settingsData }));
      } catch (err) {
        console.error('Failed to fetch CRM data from API:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Activity
  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    api<Record<string, unknown>>('/activities', {
      method: 'POST',
      body: JSON.stringify(activity),
    }).then(saved => {
      setActivities(prev => [normalizeActivity(saved), ...prev]);
    }).catch(err => console.error('Failed to save activity:', err));
  }, []);

  // Leads
  const addLead = useCallback((leadData: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>, userId?: string): Lead => {
    // Optimistic: create a temp lead for immediate UI
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const tempLead: Lead = { ...leadData, _id: tempId, createdAt: now, updatedAt: now };
    setLeads(prev => [tempLead, ...prev]);

    // Persist to API
    api<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }).then(saved => {
      setLeads(prev => prev.map(l => l._id === tempId ? saved : l));
      if (userId) {
        addActivity({
          type: 'lead_created',
          user_id: userId,
          lead_id: saved._id,
          title: `عميل محتمل جديد: ${saved.company_name}`,
          description: `تم إضافة ${saved.company_name} من مصدر ${saved.source}`,
          metadata: { source: saved.source, industry: saved.industry },
        });
      }
    }).catch(err => {
      console.error('Failed to create lead:', err);
      setLeads(prev => prev.filter(l => l._id !== tempId));
    });

    return tempLead;
  }, [addActivity]);

  const updateLead = useCallback((id: string, updates: Partial<Lead>, userId?: string) => {
    // Optimistic update
    setLeads(prev => prev.map(l => {
      if (l._id !== id) return l;
      const updated = { ...l, ...updates, updatedAt: new Date().toISOString() };
      if (userId && updates.status && updates.status !== l.status) {
        addActivity({
          type: 'lead_updated',
          user_id: userId,
          lead_id: id,
          title: `تحديث حالة ${l.company_name}`,
          description: `تم تغيير حالة "${l.company_name}" من "${l.status}" إلى "${updates.status}"`,
          metadata: { old_status: l.status, new_status: updates.status },
        });
      }
      return updated;
    }));

    api<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(err => console.error('Failed to update lead:', err));
  }, [addActivity]);

  const deleteLead = useCallback((id: string, userId?: string) => {
    const lead = leads.find(l => l._id === id);
    setLeads(prev => prev.filter(l => l._id !== id));

    api<unknown>(`/leads/${id}`, { method: 'DELETE' })
      .then(() => {
        if (userId && lead) {
          addActivity({
            type: 'lead_deleted',
            user_id: userId,
            lead_id: id,
            title: `حذف عميل: ${lead.company_name}`,
            description: `تم حذف ${lead.company_name}`,
          });
        }
      })
      .catch(err => console.error('Failed to delete lead:', err));
  }, [leads, addActivity]);

  const importLeads = useCallback(async (leadsData: Omit<Lead, '_id' | 'createdAt' | 'updatedAt'>[], userId?: string) => {
    // Client-side pre-filter for validation
    const validLeads = leadsData.filter(d => d.company_name && d.phone);
    const failed = leadsData.length - validLeads.length;

    try {
      const result = await api<{ success: number; failed: number; duplicates: number; leads: Lead[] }>('/leads/import', {
        method: 'POST',
        body: JSON.stringify({ leads: validLeads }),
      });

      if (result.leads?.length > 0) {
        setLeads(prev => [...result.leads, ...prev]);
      }
      if (userId && result.success > 0) {
        addActivity({
          type: 'import',
          user_id: userId,
          title: `استيراد ${result.success} عميل محتمل`,
          description: `تم استيراد ${result.success} عميل جديد، ${result.duplicates} مكرر، ${result.failed + failed} فاشل`,
          metadata: { success: result.success, failed: result.failed + failed, duplicates: result.duplicates },
        });
      }
      return { success: result.success, failed: result.failed + failed, duplicates: result.duplicates };
    } catch (err) {
      console.error('Failed to import leads:', err);
      return { success: 0, failed: leadsData.length, duplicates: 0 };
    }
  }, [addActivity]);

  const getLeadById = useCallback((id: string) => leads.find(l => l._id === id), [leads]);

  // Calls
  const addCall = useCallback((callData: Omit<Call, '_id'>, userId?: string): Call => {
    const tempId = `temp_${Date.now()}`;
    const tempCall: Call = { ...callData, _id: tempId };
    setCalls(prev => [tempCall, ...prev]);

    const lead = leads.find(l => l._id === callData.lead_id);
    const resultLabels: Record<string, string> = {
      answered: 'رد على المكالمة',
      no_answer: 'لم يرد',
      busy: 'مشغول',
      rejected: 'رفض',
      voicemail: 'بريد صوتي',
    };

    api<Call>('/calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    }).then(saved => {
      setCalls(prev => prev.map(c => c._id === tempId ? saved : c));
      addActivity({
        type: 'call',
        user_id: callData.user_id,
        lead_id: callData.lead_id,
        title: `مكالمة مع ${lead?.company_name || 'عميل غير معروف'}`,
        description: `${resultLabels[callData.result] || callData.result}، مدة ${Math.floor(callData.duration / 60)}:${(callData.duration % 60).toString().padStart(2, '0')} دقيقة${callData.notes ? `. ${callData.notes}` : ''}`,
        metadata: { duration: callData.duration, result: callData.result },
      });
    }).catch(err => {
      console.error('Failed to create call:', err);
      setCalls(prev => prev.filter(c => c._id !== tempId));
    });

    // Auto-update lead status based on call result
    if (lead) {
      if (callData.result === 'answered' && lead.status === 'new') {
        updateLead(lead._id, { status: 'contacted' });
      }
      if (callData.next_followup) {
        updateLead(lead._id, { status: lead.status === 'new' ? 'contacted' : 'followup' });
      }
    }

    return tempCall;
  }, [leads, addActivity, updateLead]);

  const getCallsForLead = useCallback((leadId: string) => calls.filter(c => c.lead_id === leadId), [calls]);

  // Meetings
  const addMeeting = useCallback((meetingData: Omit<Meeting, '_id' | 'createdAt'>, userId?: string): Meeting => {
    const tempId = `temp_${Date.now()}`;
    const tempMeeting: Meeting = { ...meetingData, _id: tempId, createdAt: new Date().toISOString() };
    setMeetings(prev => [tempMeeting, ...prev]);

    const lead = leads.find(l => l._id === meetingData.lead_id);

    api<Meeting>('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    }).then(saved => {
      setMeetings(prev => prev.map(m => m._id === tempId ? saved : m));
      addActivity({
        type: 'meeting',
        user_id: meetingData.user_id,
        lead_id: meetingData.lead_id,
        title: `تم جدولة اجتماع مع ${lead?.company_name || 'عميل'}`,
        description: `اجتماع في ${new Date(meetingData.meeting_date).toLocaleDateString('ar-EG')}${meetingData.notes ? `. ${meetingData.notes}` : ''}`,
        metadata: { meeting_date: meetingData.meeting_date },
      });
    }).catch(err => {
      console.error('Failed to create meeting:', err);
      setMeetings(prev => prev.filter(m => m._id !== tempId));
    });

    // Update lead status to meeting
    if (lead && lead.status !== 'closed') {
      updateLead(lead._id, { status: 'meeting' });
    }

    return tempMeeting;
  }, [leads, addActivity, updateLead]);

  const updateMeeting = useCallback((id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(m => m._id === id ? { ...m, ...updates } : m));
    api<Meeting>(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(err => console.error('Failed to update meeting:', err));
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings(prev => prev.filter(m => m._id !== id));
    api<unknown>(`/meetings/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to delete meeting:', err));
  }, []);

  // Users
  const addUser = useCallback((userData: Omit<User, '_id' | 'createdAt'> & { password: string }): User => {
    const tempId = `temp_${Date.now()}`;
    const { password, ...userWithoutPassword } = userData;
    const tempUser: User = { ...userWithoutPassword, _id: tempId, createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, tempUser]);

    api<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }).then(saved => {
      setUsers(prev => prev.map(u => u._id === tempId ? saved : u));
      addActivity({
        type: 'user_created',
        user_id: saved._id,
        title: `مستخدم جديد: ${saved.name}`,
        description: `تم إضافة ${saved.name} بدور ${saved.role}`,
      });
    }).catch(err => {
      console.error('Failed to create user:', err);
      setUsers(prev => prev.filter(u => u._id !== tempId));
    });

    return tempUser;
  }, [addActivity]);

  const updateUser = useCallback((id: string, updates: Partial<User> & { password?: string }) => {
    const { password, ...safeUpdates } = updates;
    setUsers(prev => prev.map(u => u._id === id ? { ...u, ...safeUpdates } : u));
    api<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(err => console.error('Failed to update user:', err));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u._id !== id));
    api<unknown>(`/users/${id}`, { method: 'DELETE' })
      .catch(err => console.error('Failed to delete user:', err));
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<CRMSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    api<CRMSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).catch(err => console.error('Failed to update settings:', err));
  }, []);

  // Stats
  const getStats = useCallback(() => {
    const totalLeads = leads.length;
    const totalCalls = calls.length;
    const answeredCalls = calls.filter(c => c.result === 'answered').length;
    const contactRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
    const closedLeads = leads.filter(l => l.status === 'closed').length;
    const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;
    const totalDuration = calls.reduce((sum, c) => sum + c.duration, 0);
    const avgCallDuration = answeredCalls > 0
      ? calls.filter(c => c.result === 'answered').reduce((sum, c) => sum + c.duration, 0) / answeredCalls
      : 0;

    return { totalLeads, totalCalls, answeredCalls, contactRate, conversionRate, closedLeads, avgCallDuration, totalDuration };
  }, [leads, calls]);

  return (
    <CRMContext.Provider value={{
      leads, calls, meetings, users, activities, settings, loading,
      addLead, updateLead, deleteLead, importLeads, getLeadById,
      addCall, getCallsForLead,
      addMeeting, updateMeeting, deleteMeeting,
      addUser, updateUser, deleteUser,
      addActivity,
      updateSettings,
      getStats,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
