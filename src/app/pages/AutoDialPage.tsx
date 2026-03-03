import { useState, useEffect } from 'react';
import { Phone, Play, Pause, SkipForward, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useCRM } from '../contexts/CRMContext';
import { Lead } from '../types';
import { toast } from 'sonner';
import { CallModal } from '../components/CallModal';
import { useLanguage } from '../contexts/LanguageContext';

interface QueueItem {
  id: string;
  lead: Lead;
  priority: number;
  addedAt: string;
}

export default function AutoDialPage() {
  const { language, t } = useLanguage();
  const { leads, users } = useCRM();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDialing, setIsDialing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [callInterval, setCallInterval] = useState(30); // seconds

  // Auto-dial logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDialing && currentIndex < queue.length) {
      timer = setTimeout(() => {
        const item = queue[currentIndex];
        setCurrentLead(item.lead);
        setShowCallModal(true);
        toast.success(language === 'ar' 
          ? `جاري الاتصال بـ ${item.lead.company_name}...`
          : `Calling ${item.lead.company_name}...`
        );
      }, callInterval * 1000);
    }
    return () => clearTimeout(timer);
  }, [isDialing, currentIndex, queue, callInterval, language]);

  const addToQueue = () => {
    if (!selectedLeadId) {
      toast.error(language === 'ar' ? 'الرجاء اختيار عميل محتمل' : 'Please select a lead');
      return;
    }
    const lead = leads.find(l => l._id === selectedLeadId);
    if (!lead) return;

    // Check if already in queue
    if (queue.some(item => item.lead._id === lead._id)) {
      toast.error(language === 'ar' 
        ? 'هذا العميل موجود في قائمة الانتظار بالفعل' 
        : 'This lead is already in the queue'
      );
      return;
    }

    const newItem: QueueItem = {
      id: Math.random().toString(36).substring(7),
      lead,
      priority: queue.length + 1,
      addedAt: new Date().toISOString(),
    };
    setQueue([...queue, newItem]);
    setSelectedLeadId('');
    toast.success(language === 'ar' 
      ? `تم إضافة ${lead.company_name} إلى قائمة الاتصال`
      : `${lead.company_name} added to call queue`
    );
  };

  const removeFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
    toast.success(language === 'ar' ? 'تم الإزالة من قائمة الانتظار' : 'Removed from queue');
  };

  const movePriority = (id: string, direction: 'up' | 'down') => {
    const index = queue.findIndex(item => item.id === id);
    if (index === -1) return;

    const newQueue = [...queue];
    if (direction === 'up' && index > 0) {
      [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
    } else if (direction === 'down' && index < queue.length - 1) {
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    }

    // Update priorities
    newQueue.forEach((item, idx) => {
      item.priority = idx + 1;
    });
    setQueue(newQueue);
  };

  const startDialing = () => {
    if (queue.length === 0) {
      toast.error(language === 'ar' ? 'قائمة الاتصال فارغة' : 'Call queue is empty');
      return;
    }
    setIsDialing(true);
    toast.success(language === 'ar' ? 'تم بدء الاتصال التلقا��ي' : 'Auto dial started');
  };

  const pauseDialing = () => {
    setIsDialing(false);
    toast.info(language === 'ar' ? 'تم إيقاف الاتصال التلقائي مؤقتاً' : 'Auto dial paused');
  };

  const skipCurrent = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowCallModal(false);
      toast.info(language === 'ar' ? 'تم تخطي المكالمة الحالية' : 'Current call skipped');
    } else {
      setIsDialing(false);
      toast.info(language === 'ar' ? 'انتهت قائمة الاتصال' : 'Call queue ended');
    }
  };

  const handleCallComplete = () => {
    setShowCallModal(false);
    // Move to next
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsDialing(false);
      setCurrentIndex(0);
      toast.success(language === 'ar' 
        ? 'تم الانتهاء من جميع المكالمات في القائمة'
        : 'All calls in queue completed'
      );
    }
  };

  const availableLeads = leads.filter(
    lead => lead.status !== 'closed' && lead.status !== 'lost'
  );

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <Phone className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('auto_dial_queue')}</h1>
            <p className="text-muted-foreground">{t('manage_auto_calls')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isDialing ? (
            <Button onClick={startDialing} size="lg" className="gap-2">
              <Play className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
              {t('start_dialing')}
            </Button>
          ) : (
            <>
              <Button onClick={pauseDialing} variant="secondary" size="lg" className="gap-2">
                <Pause className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t('pause')}
              </Button>
              <Button onClick={skipCurrent} variant="outline" size="lg" className="gap-2">
                <SkipForward className={`w-5 h-5 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {t('skip')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('in_queue')}</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queue.length}</div>
            <p className="text-xs text-muted-foreground">{t('potential_client')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('called')}</CardTitle>
            <Phone className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentIndex}</div>
            <p className="text-xs text-muted-foreground">{t('call_completed')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('remaining')}</CardTitle>
            <Phone className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(0, queue.length - currentIndex)}</div>
            <p className="text-xs text-muted-foreground">{t('call_word')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('state_status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isDialing ? 'default' : 'secondary'}>
              {isDialing ? t('active') : t('stopped')}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {isDialing ? t('calling_now') : t('waiting_mode')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('progress')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentIndex} / {queue.length} {t('call_word')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to Queue Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('add_to_queue')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('select_lead')} />
                </SelectTrigger>
                <SelectContent>
                  {availableLeads.map(lead => (
                    <SelectItem key={lead._id} value={lead._id}>
                      {lead.company_name} - {lead.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={callInterval.toString()} onValueChange={(v) => setCallInterval(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">{language === 'ar' ? '15 ثانية' : '15 seconds'}</SelectItem>
                  <SelectItem value="30">{language === 'ar' ? '30 ثانية' : '30 seconds'}</SelectItem>
                  <SelectItem value="60">{language === 'ar' ? '1 دقيقة' : '1 minute'}</SelectItem>
                  <SelectItem value="120">{language === 'ar' ? '2 دقيقة' : '2 minutes'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addToQueue} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('call_list')} ({queue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{t('queue_empty')}</p>
              <p className="text-sm">{t('add_leads_to_start')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, index) => {
                const user = users.find(u => u._id === item.lead.assigned_to);
                const isCurrent = index === currentIndex && isDialing;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${
                      isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {/* Priority Number */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold">
                      {index + 1}
                    </div>

                    {/* Lead Info */}
                    <div className="flex-1">
                      <div className="font-semibold">{item.lead.company_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>{item.lead.phone}</span>
                        <span>•</span>
                        <span>{item.lead.industry}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {t('assigned_to_label')}: {user?.name || t('not_specified')}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isCurrent && (
                      <Badge variant="default" className="gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        {t('calling_status')}
                      </Badge>
                    )}
                    {index < currentIndex && (
                      <Badge variant="secondary">{t('was_called')}</Badge>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePriority(item.id, 'up')}
                        disabled={index === 0 || isDialing}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => movePriority(item.id, 'down')}
                        disabled={index === queue.length - 1 || isDialing}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(item.id)}
                        disabled={isDialing}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Modal */}
      {showCallModal && currentLead && (
        <CallModal
          lead={currentLead}
          isOpen={showCallModal}
          onClose={handleCallComplete}
        />
      )}
    </div>
  );
}