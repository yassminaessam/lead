import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2,
  Copy,
  Eye,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  subject?: string; // For email only
  body: string;
  variables: string[];
  category: string;
  createdAt: string;
  lastUsed?: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'رسالة ترحيب للعملاء الجدد',
    type: 'email',
    subject: 'مرحباً بك في LeadEngine CRM',
    body: 'عزيزي {name}،\n\nنحن سعداء باهتمامك بخدمات {company}. نود أن نقدم لك عرضاً خاصاً...\n\nمع تحياتنا،\nفري�� المبيعات',
    variables: ['name', 'company'],
    category: 'ترحيب',
    createdAt: '2026-02-15T10:00:00Z',
    lastUsed: '2026-02-26T14:30:00Z',
  },
  {
    id: '2',
    name: 'متابعة بعد المكالمة',
    type: 'email',
    subject: 'متابعة مكالمتنا اليوم',
    body: 'السيد/ة {name}،\n\nشكراً لوقتك في مكالمتنا اليوم. كما وعدتك، أرفق لك {attachment_description}.\n\nإذا كان لديك أي استفسار، لا تتردد في التواصل.\n\nمع تحياتنا،\n{sender_name}',
    variables: ['name', 'attachment_description', 'sender_name'],
    category: 'متابعة',
    createdAt: '2026-02-16T11:00:00Z',
    lastUsed: '2026-02-25T16:00:00Z',
  },
  {
    id: '3',
    name: 'عرض سعر',
    type: 'email',
    subject: 'عرض سعر خدمات CRM - {company}',
    body: 'عزيزي {name}،\n\nنشكرك على اهتمامك بخدماتنا. نقدم لك عرض سعر خاص:\n\n• باقة {package_name}\n• السعر: {price} جنيه\n• المدة: {duration}\n\nالعرض ساري حتى {expiry_date}.\n\nمع تحياتنا،\nفريق المبيعات',
    variables: ['name', 'company', 'package_name', 'price', 'duration', 'expiry_date'],
    category: 'ع��ض سعر',
    createdAt: '2026-02-17T09:00:00Z',
    lastUsed: '2026-02-26T11:00:00Z',
  },
  {
    id: '4',
    name: 'رسالة واتساب - ترحيب',
    type: 'whatsapp',
    body: 'مرحباً {name} 👋\n\nشكراً لاهتمامك بـ {company}!\n\nنحن هنا لمساعدتك. هل يمكنني الاتصال بك في {time}؟',
    variables: ['name', 'company', 'time'],
    category: 'ترحيب',
    createdAt: '2026-02-18T10:00:00Z',
    lastUsed: '2026-02-26T08:30:00Z',
  },
  {
    id: '5',
    name: 'رسالة واتساب - تذكير باجتماع',
    type: 'whatsapp',
    body: 'السلام عليكم {name} 🙋‍♂️\n\nتذكير باجتماعنا غداً:\n📅 {date}\n🕐 {time}\n📍 {location}\n\nنراك قريباً!',
    variables: ['name', 'date', 'time', 'location'],
    category: 'تذكير',
    createdAt: '2026-02-19T14:00:00Z',
    lastUsed: '2026-02-24T16:00:00Z',
  },
  {
    id: '6',
    name: 'رسالة واتساب - عرض خاص',
    type: 'whatsapp',
    body: '🎉 عرض خاص لك {name}!\n\nاحصل على خصم {discount}% على باقة {package_name}\n\n⏰ العرض ينتهي {expiry_date}\n\nاتصل بنا الآن! 📞',
    variables: ['name', 'discount', 'package_name', 'expiry_date'],
    category: 'عروض',
    createdAt: '2026-02-20T11:00:00Z',
  },
];

export default function TemplatesPage() {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    type: 'email',
    category: 'عام',
    variables: [],
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.body) {
      toast.error(language === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const template: Template = {
      id: Math.random().toString(36).substring(7),
      name: newTemplate.name!,
      type: newTemplate.type!,
      subject: newTemplate.subject,
      body: newTemplate.body!,
      variables: extractVariables(newTemplate.body!),
      category: newTemplate.category!,
      createdAt: new Date().toISOString(),
    };

    setTemplates([...templates, template]);
    setNewTemplate({ type: 'email', category: 'عام', variables: [] });
    setIsCreateModalOpen(false);
    toast.success(language === 'ar' ? 'تم إنشاء القالب بنجاح' : 'Template created successfully');
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;

    setTemplates(templates.map(t => 
      t.id === editingTemplate.id ? editingTemplate : t
    ));
    setEditingTemplate(null);
    toast.success(language === 'ar' ? 'تم تحديث القالب بنجاح' : 'Template updated successfully');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success(language === 'ar' ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
  };

  const handleDuplicateTemplate = (template: Template) => {
    const newTemplate: Template = {
      ...template,
      id: Math.random().toString(36).substring(7),
      name: `${template.name} (${language === 'ar' ? 'نسخة' : 'copy'})`,
      createdAt: new Date().toISOString(),
    };
    setTemplates([...templates, newTemplate]);
    toast.success(language === 'ar' ? 'تم نسخ القالب بنجاح' : 'Template copied successfully');
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  };

  const emailTemplates = templates.filter(t => t.type === 'email');
  const whatsappTemplates = templates.filter(t => t.type === 'whatsapp');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <MessageSquare className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{language === 'ar' ? 'قوالب الرسائل' : 'Message Templates'}</h1>
            <p className="text-muted-foreground">{language === 'ar' ? 'إدارة قوالب البريد الإلكتروني وWhatsApp' : 'Manage email and WhatsApp templates'}</p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'قالب جديد' : 'New Template'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" aria-describedby="create-template-description">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إنشاء قالب جديد' : 'Create New Template'}</DialogTitle>
              <DialogDescription id="create-template-description">
                {language === 'ar' ? 'أنشئ قالب بريد إلكتروني أو واتساب جديد' : 'Create a new email or WhatsApp template'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم القالب *' : 'Template Name *'}</Label>
                  <Input 
                    value={newTemplate.name || ''} 
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: رسالة ترحيب' : 'Example: Welcome message'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'النوع *' : 'Type *'}</Label>
                  <select 
                    className="w-full border rounded-md p-2"
                    value={newTemplate.type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'email' | 'whatsapp' })}
                  >
                    <option value="email">{language === 'ar' ? 'بريد إلكتروني' : 'Email'}</option>
                    <option value="whatsapp">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</option>
                  </select>
                </div>
              </div>

              {newTemplate.type === 'email' && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'موضوع الرسالة *' : 'Email Subject *'}</Label>
                  <Input 
                    value={newTemplate.subject || ''} 
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: عرض سعر خاص' : 'Example: Special price offer'}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'التصنيف' : 'Category'}</Label>
                <Input 
                  value={newTemplate.category || ''} 
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  placeholder={language === 'ar' ? 'مثال: ترحيب، متابعة، عروض' : 'Example: Welcome, Follow-up, Offers'}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'نص الرسالة *' : 'Message Body *'}</Label>
                <Textarea 
                  value={newTemplate.body || ''} 
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder={language === 'ar' ? 'استخدم {variable_name} للمتغيرات' : 'Use {variable_name} for variables'}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  استخدم {`{name}`}, {`{company}`}, {`{date}`} وغيرها كمتغيرات
                </p>
                {newTemplate.body && extractVariables(newTemplate.body).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'المتغيرات المكتشفة:' : 'Detected variables:'}</span>
                    {extractVariables(newTemplate.body).map((v, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleCreateTemplate} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {language === 'ar' ? 'حفظ القالب' : 'Save Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'قوالب البريد' : 'Email Templates'}</CardTitle>
            <Mail className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailTemplates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'قوالب WhatsApp' : 'WhatsApp Templates'}</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappTemplates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Tabs */}
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} ({emailTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp ({whatsappTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-4">
          {emailTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{language === 'ar' ? 'لا توجد قوالب بريد إلكتروني' : 'No email templates'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {emailTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{language === 'ar' ? 'الموضوع:' : 'Subject:'}</p>
                      <p className="text-sm">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{language === 'ar' ? 'المحتوى:' : 'Content:'}</p>
                      <p className="text-sm line-clamp-3 text-muted-foreground p-2 rounded" style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}>
                        {template.body}
                      </p>
                    </div>
                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">المتغيرات:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {template.lastUsed && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'آخر استخدام:' : 'Last used:'} {new Date(template.lastUsed).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* WhatsApp Templates */}
        <TabsContent value="whatsapp" className="space-y-4">
          {whatsappTemplates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{language === 'ar' ? 'لا توجد قوالب WhatsApp' : 'No WhatsApp templates'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {whatsappTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{language === 'ar' ? 'المحتوى:' : 'Content:'}</p>
                      <div className="rounded-lg p-3" style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(34, 197, 94, 0.3)'
                      }}>
                        <p className="text-sm whitespace-pre-wrap">{template.body}</p>
                      </div>
                    </div>
                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">{language === 'ar' ? 'المتغيرات:' : 'Variables:'}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {template.lastUsed && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'آخر استخدام:' : 'Last used:'} {new Date(template.lastUsed).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl" aria-describedby="edit-template-description">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'تعديل القالب' : 'Edit Template'}</DialogTitle>
              <DialogDescription id="edit-template-description">
                {language === 'ar' ? 'تعديل محتوى ومعلومات القالب' : 'Edit template content and details'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'اسم القالب' : 'Template Name'}</Label>
                <Input 
                  value={editingTemplate.name} 
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>

              {editingTemplate.type === 'email' && (
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'موضوع الرسالة' : 'Email Subject'}</Label>
                  <Input 
                    value={editingTemplate.subject || ''} 
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === 'ar' ? 'نص الرسالة' : 'Message Body'}</Label>
                <Textarea 
                  value={editingTemplate.body} 
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  rows={8}
                />
              </div>

              <Button onClick={handleUpdateTemplate} className="w-full gap-2">
                <Save className="w-4 h-4" />
                {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}