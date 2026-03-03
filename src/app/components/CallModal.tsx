import { useState } from 'react';
import { Lead } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Phone, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';
import { VoiceBridgePanel } from './VoiceBridgePanel';

interface CallModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export function CallModal({ lead, isOpen, onClose }: CallModalProps) {
  const { user } = useAuth();
  const { addCall, settings } = useCRM();
  const { language } = useLanguage();
  const [result, setResult] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = async () => {
    setIsCalling(true);

    try {
      const res = await fetch('/api/calls/android/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: lead.phone,
          deviceIP: settings.androidDeviceIP,
          devicePort: settings.androidDevicePort,
          apiKey: settings.androidApiKey,
          timeout: settings.callTimeout,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(language === 'ar' ? 'تم إرسال طلب الاتصال إلى الجهاز بنجاح' : 'Call request sent to device successfully');
      } else {
        toast.error(language === 'ar'
          ? `فشل الاتصال بالجهاز: ${data.error || 'خطأ غير معروف'}`
          : `Failed to connect: ${data.error || 'Unknown error'}`);
      }
    } catch {
      toast.error(language === 'ar' ? 'فشل الاتصال بالخادم' : 'Failed to reach server');
    }
    setIsCalling(false);
  };

  const handleSave = async () => {
    if (!result) {
      toast.error(language === 'ar' ? 'يرجى اختيار نتيجة المكالمة' : 'Please select call result');
      return;
    }

    addCall({
      lead_id: lead._id,
      user_id: user?._id || '',
      result: result as 'answered' | 'no_answer' | 'busy' | 'rejected' | 'voicemail',
      duration: parseInt(duration) || 0,
      notes: notes || undefined,
      next_followup: nextFollowup || undefined,
      created_at: new Date().toISOString(),
    }, user?._id);

    toast.success(language === 'ar' ? 'تم حفظ المكالمة بنجاح' : 'Call saved successfully');

    // Reset form
    setResult('');
    setNotes('');
    setDuration('');
    setNextFollowup('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl" aria-describedby="call-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            اتصال بـ {lead.company_name}
          </DialogTitle>
          <DialogDescription id="call-dialog-description">
            رقم الهاتف: {lead.phone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Call Button */}
          <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <p className="text-sm text-muted-foreground">
              <Smartphone className="inline h-4 w-4 ml-1" />
              سيتم إرسال طلب الاتصال إلى جهاز Android
            </p>
            <Button
              className="w-full"
              onClick={handleCall}
              disabled={isCalling}
            >
              {isCalling ? 'جاري الاتصال...' : 'اتصل الآن'}
            </Button>
          </div>

          {/* WebRTC Voice Bridge */}
          <VoiceBridgePanel />

          {/* Call Result */}
          <div className="space-y-2">
            <Label>نتيجة المكالمة</Label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue placeholder="اختر النتيجة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="answered">رد على المكالمة</SelectItem>
                <SelectItem value="no_answer">لم يرد</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
                <SelectItem value="rejected">رفض المكالمة</SelectItem>
                <SelectItem value="voicemail">بريد صوتي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              placeholder="اكتب ملاحظات المكالمة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'مدة المكالمة (ثانية)' : 'Call Duration (seconds)'}</Label>
            <Input
              type="number"
              placeholder={language === 'ar' ? 'مثال: 120' : 'e.g. 120'}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0"
            />
          </div>

          {/* Next Follow-up */}
          {(result === 'answered' || result === 'no_answer' || result === 'busy') && (
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'موعد المتابعة القادمة' : 'Next Follow-up'}</Label>
              <Input
                type="datetime-local"
                value={nextFollowup}
                onChange={(e) => setNextFollowup(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              إلغاء
            </Button>
            <Button onClick={handleSave} className="flex-1">
              حفظ المكالمة
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Also export as default for compatibility
export default CallModal;