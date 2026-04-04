import { useState, useEffect } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import {
  Settings as SettingsIcon,
  Bell,
  Smartphone,
  Database,
  Mail,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  Save,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, updateSettings } = useCRM();
  const { language: appLanguage } = useLanguage();

  // General Settings
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone);
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [language, setLanguage] = useState('ar');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);
  const [smsNotifications, setSmsNotifications] = useState(settings.smsNotifications);
  const [desktopNotifications, setDesktopNotifications] = useState(settings.desktopNotifications);
  const [notifyNewLead, setNotifyNewLead] = useState(settings.notifyNewLead);
  const [notifyMissedCall, setNotifyMissedCall] = useState(settings.notifyMissedCall);
  const [notifyFollowUp, setNotifyFollowUp] = useState(settings.notifyFollowUp);

  // Android Dialer Settings
  const [androidDeviceIP, setAndroidDeviceIP] = useState(settings.androidDeviceIP);
  const [androidDevicePort, setAndroidDevicePort] = useState(settings.androidDevicePort);
  const [androidApiKey, setAndroidApiKey] = useState(settings.androidApiKey);
  const [autoRetry, setAutoRetry] = useState(settings.autoRetry);
  const [retryAttempts, setRetryAttempts] = useState(String(settings.retryAttempts));
  const [callTimeout, setCallTimeout] = useState(String(settings.callTimeout));

  // Database Settings
  const [mongodbUri, setMongodbUri] = useState(settings.mongodbUri);
  const [showMongoUri, setShowMongoUri] = useState(false);
  const [autoBackup, setAutoBackup] = useState(settings.autoBackup);
  const [backupFrequency, setBackupFrequency] = useState(settings.backupFrequency);
  const [backupRetention, setBackupRetention] = useState(String(settings.backupRetention));

  // Email Settings
  const [smtpHost, setSmtpHost] = useState(settings.smtpHost);
  const [smtpPort, setSmtpPort] = useState(settings.smtpPort);
  const [smtpEmail, setSmtpEmail] = useState(settings.smtpEmail);
  const [smtpPassword, setSmtpPassword] = useState(settings.smtpPassword);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [emailSignature, setEmailSignature] = useState(settings.emailSignature);

  // WhatsApp Settings
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsappEnabled);
  const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsappApiKey);
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState(settings.whatsappPhoneNumber);
  const [whatsappTemplate, setWhatsappTemplate] = useState(settings.whatsappTemplate);

  // API Settings
  const [phantombusterApiKey, setPhantombusterApiKey] = useState(settings.phantombusterApiKey);
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey);

  const handleSaveGeneral = () => {
    updateSettings({ companyName, companyPhone, companyEmail, timezone });
    toast.success(appLanguage === 'ar' ? 'تم حفظ الإعدادات العامة بنجاح' : 'General settings saved');
  };

  const handleSaveNotifications = () => {
    updateSettings({ emailNotifications, smsNotifications, desktopNotifications, notifyNewLead, notifyMissedCall, notifyFollowUp });
    toast.success(appLanguage === 'ar' ? 'تم حفظ إعدادات الإشعارات بنجاح' : 'Notification settings saved');
  };

  const handleSaveAndroid = () => {
    updateSettings({ androidDeviceIP, androidDevicePort, androidApiKey, autoRetry, retryAttempts: Number(retryAttempts), callTimeout: Number(callTimeout) });
    toast.success(appLanguage === 'ar' ? 'تم حفظ إعدادات Android بنجاح' : 'Android settings saved');
  };

  const handleTestAndroidConnection = async () => {
    toast.info(appLanguage === 'ar' ? 'جاري اختبار الاتصال...' : 'Testing connection...');
    try {
      const res = await fetch('/api/calls/android/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIP: androidDeviceIP,
          devicePort: androidDevicePort,
          apiKey: androidApiKey,
        }),
      });
      const data = await res.json();
      if (data.connected) {
        toast.success(appLanguage === 'ar' ? '✅ تم الاتصال بجهاز Android بنجاح' : '✅ Connected to Android device successfully');
      } else {
        toast.error(appLanguage === 'ar' ? `❌ فشل الاتصال: ${data.error || 'تأكد من عنوان IP والمنفذ'}` : `❌ Connection failed: ${data.error || 'Check IP address and port'}`);
      }
    } catch {
      toast.error(appLanguage === 'ar' ? '❌ فشل الاتصال بالخادم' : '❌ Failed to connect to server');
    }
  };

  const handleSaveDatabase = () => {
    updateSettings({ mongodbUri, autoBackup, backupFrequency, backupRetention: Number(backupRetention) });
    toast.success(appLanguage === 'ar' ? 'تم حفظ إعدادات قاعدة البيانات نجاح' : 'Database settings saved');
  };

  const handleBackupNow = async () => {
    toast.info(appLanguage === 'ar' ? 'جاري إنشاء نسخة احتياطية...' : 'Creating backup...');
    try {
      const response = await fetch('/api/backup/export');
      if (!response.ok) throw new Error('Backup failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadengine-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(appLanguage === 'ar' ? '✅ تم تحميل النسخة الاحتياطية بنجاح' : '✅ Backup downloaded successfully');
    } catch (error) {
      toast.error(appLanguage === 'ar' ? '❌ فشل إنشاء النسخة الاحتياطية' : '❌ Backup failed');
      console.error('Backup error:', error);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.info(appLanguage === 'ar' ? 'جاري استعادة النسخة الاحتياطية...' : 'Restoring backup...');
    
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.data) {
        throw new Error('Invalid backup file');
      }

      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: backup.data }),
      });

      if (!response.ok) throw new Error('Restore failed');
      
      const result = await response.json();
      toast.success(
        appLanguage === 'ar' 
          ? `✅ تم استعادة النسخة الاحتياطية: ${result.results.leads.inserted} عملاء، ${result.results.calls.inserted} مكالمات`
          : `✅ Backup restored: ${result.results.leads.inserted} leads, ${result.results.calls.inserted} calls`
      );
      
      // Reload page to refresh data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(appLanguage === 'ar' ? '❌ فشل استعادة النسخة الاحتياطية' : '❌ Restore failed');
      console.error('Restore error:', error);
    }
    
    // Clear input
    event.target.value = '';
  };

  const handleExportCollection = async (collection: string) => {
    const collectionNames: Record<string, { ar: string; en: string }> = {
      leads: { ar: 'العملاء المحتملين', en: 'Leads' },
      calls: { ar: 'المكالمات', en: 'Calls' },
      meetings: { ar: 'الاجتماعات', en: 'Meetings' },
      users: { ar: 'المستخدمين', en: 'Users' },
      activities: { ar: 'النشاطات', en: 'Activities' },
    };

    toast.info(appLanguage === 'ar' ? `جاري تصدير ${collectionNames[collection].ar}...` : `Exporting ${collectionNames[collection].en}...`);
    
    try {
      const response = await fetch(`/api/backup/export/${collection}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(appLanguage === 'ar' ? `✅ تم تصدير ${collectionNames[collection].ar}` : `✅ ${collectionNames[collection].en} exported`);
    } catch (error) {
      toast.error(appLanguage === 'ar' ? '❌ فشل التصدير' : '❌ Export failed');
      console.error('Export error:', error);
    }
  };

  const handleSaveEmail = () => {
    updateSettings({ smtpHost, smtpPort, smtpEmail, smtpPassword, emailSignature });
    toast.success(appLanguage === 'ar' ? 'تم حفظ إعدادات البريد الإلكتروني بنجاح' : 'Email settings saved');
  };

  const handleTestEmail = async () => {
    toast.info(appLanguage === 'ar' ? 'جاري اختبار الاتصال...' : 'Testing connection...');
    try {
      const response = await fetch('/api/email/test', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success(appLanguage === 'ar' ? '✅ الاتصال ناجح!' : '✅ Connection successful!');
      } else {
        toast.error(appLanguage === 'ar' ? `❌ فشل الاتصال: ${result.error}` : `❌ Connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(appLanguage === 'ar' ? '❌ فشل الاتصال' : '❌ Connection failed');
    }
  };

  const handleSaveWhatsApp = () => {
    updateSettings({ whatsappEnabled, whatsappApiKey, whatsappPhoneNumber, whatsappTemplate });
    toast.success(appLanguage === 'ar' ? 'تم حفظ إعدادات WhatsApp بنجاح' : 'WhatsApp settings saved');
  };

  const handleSaveAPI = () => {
    updateSettings({ phantombusterApiKey, openaiApiKey });
    toast.success(appLanguage === 'ar' ? 'تم حفظ مفاتيح API بنجاح' : 'API keys saved');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
          <SettingsIcon className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{appLanguage === 'ar' ? 'الإعدادات' : 'Settings'}</h1>
          <p className="text-muted-foreground">{appLanguage === 'ar' ? 'إدارة إعدادات النظام والتكاملات' : 'Manage system settings and integrations'}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">{appLanguage === 'ar' ? 'عام' : 'General'}</TabsTrigger>
          <TabsTrigger value="notifications">{appLanguage === 'ar' ? 'الإشعارات' : 'Notifications'}</TabsTrigger>
          <TabsTrigger value="android">Android</TabsTrigger>
          <TabsTrigger value="database">{appLanguage === 'ar' ? 'قاعدة البيانات' : 'Database'}</TabsTrigger>
          <TabsTrigger value="email">{appLanguage === 'ar' ? 'البريد' : 'Email'}</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="api">APIs</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                                {appLanguage === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'معلومات الشركة والإعدادات الأساسية' : 'Company information and basic settings'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'اسم الشركة' : 'Company Name'}</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Cairo">{appLanguage === 'ar' ? 'القاهرة (GMT+2)' : 'Cairo (GMT+2)'}</SelectItem>
                      <SelectItem value="Asia/Dubai">{appLanguage === 'ar' ? 'دبي (GMT+4)' : 'Dubai (GMT+4)'}</SelectItem>
                      <SelectItem value="Asia/Riyadh">{appLanguage === 'ar' ? 'الرياض (GMT+3)' : 'Riyadh (GMT+3)'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'اللغة' : 'Language'}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">{appLanguage === 'ar' ? 'العربية' : 'Arabic'}</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveGeneral} className="gap-2">
                <Save className="w-4 h-4" />
                {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {appLanguage === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'تخصيص طريقة استلام الإشعارات' : 'Customize how you receive notifications'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">{appLanguage === 'ar' ? 'قنوات الإشعارات' : 'Notification Channels'}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'استلام إشعارات عبر البريد' : 'Receive notifications via email'}</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'رسائل SMS' : 'SMS Messages'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'استلام إشعارات عبر الرسائل النصية' : 'Receive notifications via SMS'}</p>
                  </div>
                  <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'إشعارات سطح المكتب' : 'Desktop Notifications'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'عرض إشعارات في المتصفح' : 'Show notifications in browser'}</p>
                  </div>
                  <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">{appLanguage === 'ar' ? 'أنواع الإشعارات' : 'Notification Types'}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'عميل محتمل جديد' : 'New Lead'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'عند إضافة عميل محتمل جديد' : 'When a new lead is added'}</p>
                  </div>
                  <Switch checked={notifyNewLead} onCheckedChange={setNotifyNewLead} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'مكالمة فائتة' : 'Missed Call'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'عند عدم الرد على المكالمة' : 'When a call is not answered'}</p>
                  </div>
                  <Switch checked={notifyMissedCall} onCheckedChange={setNotifyMissedCall} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{appLanguage === 'ar' ? 'تذكير المتابعة' : 'Follow-up Reminder'}</p>
                    <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'تذكير بمواعيد المتابعة' : 'Reminder for follow-up appointments'}</p>
                  </div>
                  <Switch checked={notifyFollowUp} onCheckedChange={setNotifyFollowUp} />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="gap-2">
                <Save className="w-4 h-4" />
                {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Android Dialer Settings */}
        <TabsContent value="android" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                {appLanguage === 'ar' ? 'إعدادات Android Dialer' : 'Android Dialer Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'ربط تطبيق الاتصال بجهاز Android' : 'Connect dialer app to Android device'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'عنوان IP لجهاز Android' : 'Android Device IP'}</Label>
                  <Input
                    placeholder="192.168.1.100"
                    value={androidDeviceIP}
                    onChange={(e) => setAndroidDeviceIP(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'رقم المنفذ (Port)' : 'Port Number'}</Label>
                  <Input
                    placeholder="8080"
                    value={androidDevicePort}
                    onChange={(e) => setAndroidDevicePort(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{appLanguage === 'ar' ? 'API Key (مفتاح الأمان)' : 'API Key (Security Key)'}</Label>
                <Input
                  type="password"
                  placeholder={appLanguage === 'ar' ? 'أدخل API Key من تطبيق Android' : 'Paste API Key from Android app'}
                  value={androidApiKey}
                  onChange={(e) => setAndroidApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {appLanguage === 'ar'
                    ? 'انسخ المفتاح من تطبيق Mobarez على جهاز Android والصقه هنا'
                    : 'Copy the key from Mobarez app on Android and paste it here'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{appLanguage === 'ar' ? 'إعادة المحاولة التلقائية' : 'Auto Retry'}</p>
                  <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'إعادة الاتصال في حالة افشل' : 'Retry connection on failure'}</p>
                </div>
                <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
              </div>

              {autoRetry && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{appLanguage === 'ar' ? 'عدد محاولات إعادة الاتصال' : 'Retry Attempts'}</Label>
                    <Select value={retryAttempts} onValueChange={setRetryAttempts}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{appLanguage === 'ar' ? '1 محاولة' : '1 attempt'}</SelectItem>
                        <SelectItem value="2">{appLanguage === 'ar' ? '2 محاولات' : '2 attempts'}</SelectItem>
                        <SelectItem value="3">{appLanguage === 'ar' ? '3 محاولات' : '3 attempts'}</SelectItem>
                        <SelectItem value="5">{appLanguage === 'ar' ? '5 محاولات' : '5 attempts'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{appLanguage === 'ar' ? 'مهلة المكالمة (ثانية)' : 'Call Timeout (seconds)'}</Label>
                    <Select value={callTimeout} onValueChange={setCallTimeout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">{appLanguage === 'ar' ? '15 ثانية' : '15 sec'}</SelectItem>
                        <SelectItem value="30">{appLanguage === 'ar' ? '30 ثانية' : '30 sec'}</SelectItem>
                        <SelectItem value="45">{appLanguage === 'ar' ? '45 ثانية' : '45 sec'}</SelectItem>
                        <SelectItem value="60">{appLanguage === 'ar' ? '60 ثانية' : '60 sec'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveAndroid} className="gap-2">
                  <Save className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </Button>
                <Button onClick={handleTestAndroidConnection} variant="outline" className="gap-2">
                  <Zap className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                </Button>
              </div>

              <div className="border-2 rounded-lg p-4 mt-4" style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 0.3)'
              }}>
                <h4 className="font-semibold mb-2" style={{ color: 'rgba(59, 130, 246, 0.9)' }}>{appLanguage === 'ar' ? 'تعليمات الإعداد:' : 'Setup Instructions:'}</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>{appLanguage === 'ar' ? 'قم بتثبيت تطبيق LeadEngine Dialer على جهاز Android' : 'Install LeadEngine Dialer app on your Android device'}</li>
                  <li>{appLanguage === 'ar' ? 'تأكد من أن الجهاز متصل بنفس شبكة WiFi' : 'Make sure the device is on the same WiFi network'}</li>
                  <li>{appLanguage === 'ar' ? 'افتح التطبيق واحصل على عنوان IP من الإعدادات' : 'Open the app and get the IP address from settings'}</li>
                  <li>{appLanguage === 'ar' ? 'أدخل عنوان IP والمنفذ هنا واختبر الاتصال' : 'Enter the IP and port here and test the connection'}</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {appLanguage === 'ar' ? 'إعدادات قاعدة البيانات' : 'Database Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'إدارة الاتصال والنسخ الاحتياطي' : 'Manage connection and backups'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{appLanguage === 'ar' ? 'رابط MongoDB' : 'MongoDB URI'}</Label>
                <div className="relative">
                  <Input
                    type={showMongoUri ? "text" : "password"}
                    value={mongodbUri}
                    onChange={(e) => setMongodbUri(e.target.value)}
                    placeholder="mongodb://localhost:27017/leadengine"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMongoUri(!showMongoUri)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showMongoUri ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{appLanguage === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Auto Backup'}</p>
                  <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'إنشاء نسخ احتياطية بشكل دوري' : 'Create periodic backups'}</p>
                </div>
                <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
              </div>

              {autoBackup && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{appLanguage === 'ar' ? 'تكرار النسخ الاحتياطي' : 'Backup Frequency'}</Label>
                    <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">{appLanguage === 'ar' ? 'كل ساعة' : 'Hourly'}</SelectItem>
                        <SelectItem value="daily">{appLanguage === 'ar' ? 'يومياً' : 'Daily'}</SelectItem>
                        <SelectItem value="weekly">{appLanguage === 'ar' ? 'أسبوعياً' : 'Weekly'}</SelectItem>
                        <SelectItem value="monthly">{appLanguage === 'ar' ? 'شهرياً' : 'Monthly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{appLanguage === 'ar' ? 'الاحتفاظ بالنسخ (أيام)' : 'Retention (days)'}</Label>
                    <Input
                      type="number"
                      value={backupRetention}
                      onChange={(e) => setBackupRetention(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveDatabase} className="gap-2">
                  <Save className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </Button>
                <Button onClick={handleBackupNow} variant="outline" className="gap-2">
                  <Database className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'تحميل نسخة كاملة' : 'Download Full Backup'}
                </Button>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent transition-colors text-sm font-medium">
                  <Database className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'استعادة نسخة احتياطية' : 'Restore Backup'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Export Individual Collections for MongoDB Compass */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">{appLanguage === 'ar' ? 'تصدير منفصل (لـ MongoDB Compass)' : 'Export Individual Collections (for MongoDB Compass)'}</p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleExportCollection('leads')} variant="secondary" size="sm" className="gap-2">
                    {appLanguage === 'ar' ? 'العملاء المحتملين' : 'Leads'}
                  </Button>
                  <Button onClick={() => handleExportCollection('calls')} variant="secondary" size="sm" className="gap-2">
                    {appLanguage === 'ar' ? 'المكالمات' : 'Calls'}
                  </Button>
                  <Button onClick={() => handleExportCollection('meetings')} variant="secondary" size="sm" className="gap-2">
                    {appLanguage === 'ar' ? 'الاجتماعات' : 'Meetings'}
                  </Button>
                  <Button onClick={() => handleExportCollection('users')} variant="secondary" size="sm" className="gap-2">
                    {appLanguage === 'ar' ? 'المستخدمين' : 'Users'}
                  </Button>
                  <Button onClick={() => handleExportCollection('activities')} variant="secondary" size="sm" className="gap-2">
                    {appLanguage === 'ar' ? 'النشاطات' : 'Activities'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {appLanguage === 'ar' ? 'إعدادات البريد الإلكتروني' : 'Email Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'إعداد SMTP لإرسال البريد الإلكتروني' : 'Configure SMTP for sending emails'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input type="email" value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{appLanguage === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                  <div className="relative">
                    <Input 
                      type={showSmtpPassword ? "text" : "password"} 
                      value={smtpPassword} 
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{appLanguage === 'ar' ? 'التوقيع الافتراضي' : 'Default Signature'}</Label>
                <Textarea
                  value={emailSignature}
                  onChange={(e) => setEmailSignature(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEmail} className="gap-2">
                  <Save className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </Button>
                <Button onClick={handleTestEmail} variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  {appLanguage === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {appLanguage === 'ar' ? 'إعدادات WhatsApp' : 'WhatsApp Settings'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'ربط WhatsApp Business API' : 'Connect WhatsApp Business API'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{appLanguage === 'ar' ? 'تفعيل WhatsApp' : 'Enable WhatsApp'}</p>
                  <p className="text-sm text-muted-foreground">{appLanguage === 'ar' ? 'إرسال رسائل عبر WhatsApp' : 'Send messages via WhatsApp'}</p>
                </div>
                <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
              </div>

              {whatsappEnabled && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>WhatsApp API Key</Label>
                      <Input
                        type="password"
                        value={whatsappApiKey}
                        onChange={(e) => setWhatsappApiKey(e.target.value)}
                        placeholder={appLanguage === 'ar' ? 'أدخل API Key' : 'Enter API Key'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{appLanguage === 'ar' ? 'رقم WhatsApp' : 'WhatsApp Number'}</Label>
                      <Input
                        value={whatsappPhoneNumber}
                        onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                        placeholder="201012345678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{appLanguage === 'ar' ? 'قالب الرسالة الافتراضي' : 'Default Message Template'}</Label>
                    <Textarea
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      rows={3}
                      placeholder={appLanguage === 'ar' ? 'استخدم {name} للاسم، {company} للشركة' : 'Use {name} for name, {company} for company'}
                    />
                  </div>
                </>
              )}

              <Button onClick={handleSaveWhatsApp} className="gap-2">
                <Save className="w-4 h-4" />
                {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {appLanguage === 'ar' ? 'مفاتيح API' : 'API Keys'}
              </CardTitle>
              <CardDescription>{appLanguage === 'ar' ? 'إدارة مفاتيح الخدمات الخارجية' : 'Manage external service API keys'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>PhantomBuster API Key</Label>
                <Input
                  type="password"
                  value={phantombusterApiKey}
                  onChange={(e) => setPhantombusterApiKey(e.target.value)}
                  placeholder={appLanguage === 'ar' ? 'أدخل PhantomBuster API Key' : 'Enter PhantomBuster API Key'}
                />
                <p className="text-xs text-muted-foreground">
                  {appLanguage === 'ar' ? 'للحصول على المفتاح: ' : 'Get your key: '}<a href="https://phantombuster.com" target="_blank" rel="noreferrer" className="text-blue-600">phantombuster.com</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label>{appLanguage === 'ar' ? 'OpenAI API Key (للميزات المستقبلية)' : 'OpenAI API Key (for future features)'}</Label>
                <Input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder={appLanguage === 'ar' ? 'أدخل OpenAI API Key' : 'Enter OpenAI API Key'}
                />
                <p className="text-xs text-muted-foreground">
                  {appLanguage === 'ar' ? 'للحصول على المفتاح: ' : 'Get your key: '}<a href="https://platform.openai.com" target="_blank" rel="noreferrer" className="text-blue-600">platform.openai.com</a>
                </p>
              </div>

              <Button onClick={handleSaveAPI} className="gap-2">
                <Save className="w-4 h-4" />
                {appLanguage === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}