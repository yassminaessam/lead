import { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Lead } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  GitBranch,
  Phone,
  Eye,
  ArrowLeftRight,
  Building2,
  MapPin,
  Clock,
  PhoneCall,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

type PipelineStage = 'new' | 'contacted' | 'followup' | 'meeting' | 'closed' | 'lost';

interface LogCallForm {
  result: string;
  notes: string;
  duration: string;
  nextFollowup: string;
}

const emptyCallForm: LogCallForm = {
  result: '',
  notes: '',
  duration: '',
  nextFollowup: '',
};

export default function SalesPipelinePage() {
  const { leads, updateLead, addCall } = useCRM();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [logCallLead, setLogCallLead] = useState<Lead | null>(null);
  const [callForm, setCallForm] = useState<LogCallForm>({ ...emptyCallForm });
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Only show leads assigned to this sales user
  const myLeads = leads.filter(l => l.assigned_to === user?._id);

  const stages: { key: PipelineStage; color: string; bgColor: string }[] = [
    { key: 'new', color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)' },
    { key: 'contacted', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { key: 'followup', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    { key: 'meeting', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    { key: 'closed', color: '#06d6a0', bgColor: 'rgba(6, 214, 160, 0.1)' },
    { key: 'lost', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  ];

  const stageLabels: Record<PipelineStage, string> = {
    new: t('pipeline_new'),
    contacted: t('pipeline_contacted'),
    followup: t('pipeline_followup'),
    meeting: t('pipeline_meeting'),
    closed: t('pipeline_closed'),
    lost: t('pipeline_lost'),
  };

  const getLeadsForStage = (stage: PipelineStage) =>
    myLeads.filter(l => l.status === stage);

  const handleMoveLead = (leadId: string, newStatus: PipelineStage) => {
    updateLead(leadId, { status: newStatus }, user?._id);
    toast.success(
      language === 'ar'
        ? `تم نقل العميل إلى "${stageLabels[newStatus]}"`
        : `Lead moved to "${stageLabels[newStatus]}"`
    );
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLeadId) {
      const lead = myLeads.find(l => l._id === draggedLeadId);
      if (lead && lead.status !== stage) {
        handleMoveLead(draggedLeadId, stage);
      }
      setDraggedLeadId(null);
    }
  };

  const handleLogCall = () => {
    if (!logCallLead || !callForm.result) {
      toast.error(
        language === 'ar'
          ? 'يرجى اختيار نتيجة المكالمة'
          : 'Please select call result'
      );
      return;
    }

    addCall(
      {
        lead_id: logCallLead._id,
        user_id: user?._id || '',
        result: callForm.result as 'answered' | 'no_answer' | 'busy' | 'rejected' | 'voicemail',
        duration: parseInt(callForm.duration) || 0,
        notes: callForm.notes || undefined,
        next_followup: callForm.nextFollowup || undefined,
        created_at: new Date().toISOString(),
      },
      user?._id
    );

    toast.success(
      language === 'ar' ? 'تم تسجيل نتيجة المكالمة' : 'Call result logged'
    );
    setLogCallLead(null);
    setCallForm({ ...emptyCallForm });
  };

  const resultLabels: Record<string, string> = {
    answered: language === 'ar' ? 'رد على المكالمة' : 'Answered',
    no_answer: language === 'ar' ? 'لم يرد' : 'No Answer',
    busy: language === 'ar' ? 'مشغول' : 'Busy',
    rejected: language === 'ar' ? 'رفض المكالمة' : 'Rejected',
    voicemail: language === 'ar' ? 'بريد صوتي' : 'Voicemail',
  };

  const isArabic = language === 'ar';

  return (
    <div className="p-8 space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <GitBranch className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('sales_pipeline')}</h1>
            <p className="text-muted-foreground">{t('manage_pipeline')}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {stages.map(stage => (
          <div
            key={stage.key}
            className="p-3 rounded-lg text-center"
            style={{ backgroundColor: stage.bgColor }}
          >
            <div className="text-2xl font-bold" style={{ color: stage.color }}>
              {getLeadsForStage(stage.key).length}
            </div>
            <div className="text-xs font-medium" style={{ color: stage.color }}>
              {stageLabels[stage.key]}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <ArrowLeftRight className="h-4 w-4" />
        {t('drag_drop_hint')}
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto" dir={isArabic ? 'rtl' : 'ltr'}>
        {stages.map(stage => (
          <div
            key={stage.key}
            className="min-w-[240px] min-h-0 rounded-xl border bg-card overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            {/* Column Header */}
            <div
              className="p-3 rounded-t-xl border-b flex items-center justify-between"
              style={{ backgroundColor: stage.bgColor }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-semibold text-sm">{stageLabels[stage.key]}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {getLeadsForStage(stage.key).length}
              </Badge>
            </div>

            {/* Lead Cards */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {getLeadsForStage(stage.key).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {t('no_leads_in_stage')}
                </p>
              ) : (
                getLeadsForStage(stage.key).map(lead => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={() => handleDragStart(lead._id)}
                    className="w-full max-w-full p-3 rounded-lg border bg-background hover:shadow-md transition-all cursor-grab active:cursor-grabbing group overflow-hidden"
                  >
                    <div className="font-medium text-sm mb-2 truncate max-w-full" title={lead.company_name}>
                      {lead.company_name}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground min-w-0" dir={isArabic ? 'rtl' : 'ltr'}>
                      <div className="flex items-center gap-1 min-w-0">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-full">{lead.industry}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-full">{lead.city}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0" dir="ltr">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="block w-full whitespace-normal break-all leading-tight">{lead.phone}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 grid grid-cols-3 gap-1 w-full min-w-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-full min-w-0 px-0"
                        onClick={() => navigate(`/dashboard/leads/${lead._id}`)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-full min-w-0 px-0"
                        onClick={() => {
                          setLogCallLead(lead);
                          setCallForm({ ...emptyCallForm });
                        }}
                      >
                        <PhoneCall className="h-3 w-3" />
                      </Button>
                      {/* Quick Move dropdown */}
                      <Select
                        onValueChange={(val) => handleMoveLead(lead._id, val as PipelineStage)}
                      >
                        <SelectTrigger className="h-7 w-full min-w-0 px-1 justify-center [&>span]:hidden">
                          <ArrowLeftRight className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages
                            .filter(s => s.key !== stage.key)
                            .map(s => (
                              <SelectItem key={s.key} value={s.key}>
                                {stageLabels[s.key]}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Log Call Result Modal */}
      <Dialog open={!!logCallLead} onOpenChange={(open) => !open && setLogCallLead(null)}>
        <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="max-w-md" aria-describedby="log-call-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5" />
              {t('log_call_result')}
            </DialogTitle>
            <DialogDescription id="log-call-desc">
              {logCallLead?.company_name} — {logCallLead?.phone}
            </DialogDescription>
          </DialogHeader>

          {/* Instruction: Call from your phone */}
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium mb-1">
              <Phone className="h-4 w-4" />
              {t('call_from_phone')}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-500" dir="ltr">
              {logCallLead?.phone}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نتيجة المكالمة *' : 'Call Result *'}</Label>
              <Select value={callForm.result} onValueChange={(v) => setCallForm({ ...callForm, result: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر النتيجة' : 'Select result'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(resultLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                placeholder={language === 'ar' ? 'اكتب ملاحظات المكالمة...' : 'Enter call notes...'}
                value={callForm.notes}
                onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'مدة المكالمة (ثانية)' : 'Call Duration (seconds)'}</Label>
              <Input
                type="number"
                placeholder={language === 'ar' ? 'مثال: 120' : 'e.g. 120'}
                value={callForm.duration}
                onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                min="0"
              />
            </div>

            {(callForm.result === 'answered' || callForm.result === 'no_answer' || callForm.result === 'busy') && (
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'موعد المتابعة القادمة' : 'Next Follow-up'}</Label>
                <Input
                  type="datetime-local"
                  value={callForm.nextFollowup}
                  onChange={(e) => setCallForm({ ...callForm, nextFollowup: e.target.value })}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setLogCallLead(null)} className="flex-1">
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleLogCall} className="flex-1">
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
