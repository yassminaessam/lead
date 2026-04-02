import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useCRM } from '../contexts/CRMContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Building2,
  User,
  Clock,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import CallModal from '../components/CallModal';

export default function LeadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getLeadById, getCallsForLead, updateLead, users, deleteLead } = useCRM();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const lead = getLeadById(id || '');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const [editedLead, setEditedLead] = useState(lead);

  if (!lead || !editedLead) {
    return (
      <div className="p-8">
        <p>{language === 'ar' ? 'العميل غير موجود' : 'Lead not found'}</p>
      </div>
    );
  }

  const leadCalls = getCallsForLead(lead._id);
  const assignedUser = users.find(u => u._id === lead.assigned_to);

  const handleSave = () => {
    updateLead(lead._id, {
      status: editedLead.status,
      notes: editedLead.notes,
      assigned_to: editedLead.assigned_to,
    }, user?._id);
    toast.success(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
  };

  const handleDelete = () => {
    deleteLead(lead._id, user?._id);
    toast.success(language === 'ar' ? 'تم حذف العميل' : 'Lead deleted');
    navigate('/dashboard/leads');
  };

  const statusLabels: Record<string, string> = {
    new: language === 'ar' ? 'جديد' : 'New',
    contacted: language === 'ar' ? 'تم التواصل' : 'Contacted',
    followup: language === 'ar' ? 'متابعة' : 'Follow Up',
    meeting: language === 'ar' ? 'اجتماع' : 'Meeting',
    closed: language === 'ar' ? 'مغلق' : 'Closed',
    lost: language === 'ar' ? 'خسارة' : 'Lost',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/leads')}>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.company_name}</h1>
            <p className="text-gray-500">{lead.industry} • {lead.city}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {user?.role !== 'sales' && (
            <Button onClick={() => setIsCallModalOpen(true)}>
              <Phone className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'اتصل الآن' : 'Call Now'}
            </Button>
          )}
          <Button variant="outline" onClick={handleSave}>
            <Save className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Button>
          {user?.role !== 'sales' && (
            <Button variant="destructive" onClick={handleDelete}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                  <p className="font-medium" dir="ltr">{lead.phone}</p>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="font-medium" dir="ltr">{lead.email}</p>
                  </div>
                </div>
              )}

              {lead.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</p>
                    <a 
                      href={lead.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                      dir="ltr"
                    >
                      {lead.website}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المدينة' : 'City'}</p>
                  <p className="font-medium">{lead.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'الصناعة' : 'Industry'}</p>
                  <p className="font-medium">{lead.industry}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الملاحظات' : 'Notes'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedLead.notes || ''}
                onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                placeholder={language === 'ar' ? 'اكتب ملاحظاتك هنا...' : 'Write your notes here...'}
                rows={5}
              />
            </CardContent>
          </Card>

          {/* Call History - Hidden for sales role */}
          {user?.role !== 'sales' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'سجل المكالمات' : 'Call History'} ({leadCalls.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {leadCalls.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{language === 'ar' ? 'لا توجد مكالمات بعد' : 'No calls yet'}</p>
                ) : (
                  <div className="space-y-4">
                    {leadCalls.map((call) => {
                      const caller = users.find(u => u._id === call.user_id);
                      const resultLabels: Record<string, string> = {
                        answered: language === 'ar' ? 'رد على المكالمة' : 'Answered',
                        no_answer: language === 'ar' ? 'لم يرد' : 'No Answer',
                        busy: language === 'ar' ? 'مشغول' : 'Busy',
                        rejected: language === 'ar' ? 'رفض' : 'Rejected',
                        voicemail: language === 'ar' ? 'بريد صوتي' : 'Voicemail',
                      };
                      
                      return (
                        <div key={call._id} className="border-r-4 border-blue-500 pr-4 pb-4 border-b last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge>{resultLabels[call.result]}</Badge>
                              <p className="text-sm text-gray-500 mt-1">
                                <Clock className="inline h-3 w-3 ml-1" />
                                {new Date(call.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{caller?.name}</p>
                              <p className="text-sm text-gray-500">{language === 'ar' ? 'المدة' : 'Duration'}: {call.duration}{language === 'ar' ? 'ث' : 's'}</p>
                            </div>
                          </div>
                          {call.notes && (
                            <p className="text-sm text-gray-700 mt-2">{call.notes}</p>
                          )}
                          {call.next_followup && (
                            <p className="text-sm text-blue-600 mt-2">
                              {language === 'ar' ? 'متابعة' : 'Follow-up'}: {new Date(call.next_followup).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'الحالة' : 'Status'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={editedLead.status} 
                onValueChange={(val: any) => setEditedLead({ ...editedLead, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{language === 'ar' ? 'جديد' : 'New'}</SelectItem>
                  <SelectItem value="contacted">{language === 'ar' ? 'تم التواصل' : 'Contacted'}</SelectItem>
                  <SelectItem value="followup">{language === 'ar' ? 'متابعة' : 'Follow Up'}</SelectItem>
                  <SelectItem value="meeting">{language === 'ar' ? 'اجتماع' : 'Meeting'}</SelectItem>
                  <SelectItem value="closed">{language === 'ar' ? 'مغلق' : 'Closed'}</SelectItem>
                  <SelectItem value="lost">{language === 'ar' ? 'خسارة' : 'Lost'}</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <p className="text-sm text-gray-500">{language === 'ar' ? 'المسؤول' : 'Responsible'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{assignedUser?.name || (language === 'ar' ? 'غير محدد' : 'Not assigned')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">{language === 'ar' ? 'المصدر' : 'Source'}</p>
                <Badge variant="outline" className="mt-2">{lead.source}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إحصائيات سريعة' : 'Quick Stats'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{language === 'ar' ? 'عدد المكالمات' : 'Total Calls'}</span>
                <span className="font-bold">{leadCalls.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{language === 'ar' ? 'مكالمات ناجحة' : 'Successful Calls'}</span>
                <span className="font-bold text-green-600">
                  {leadCalls.filter(c => c.result === 'answered').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{language === 'ar' ? 'تاريخ الإضافة' : 'Created At'}</span>
                <span className="text-sm">
                  {new Date(lead.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{language === 'ar' ? 'آخر تحديث' : 'Last Updated'}</span>
                <span className="text-sm">
                  {new Date(lead.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CallModal
        lead={lead}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
      />
    </div>
  );
}
