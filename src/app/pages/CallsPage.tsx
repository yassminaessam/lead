import { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Search, Phone, Clock, User, PhoneCall, CheckCircle, Target, Timer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function CallsPage() {
  const { language, t } = useLanguage();
  const { calls, leads, users, getStats } = useCRM();
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const filteredCalls = calls.filter(call => {
    const lead = leads.find(l => l._id === call.lead_id);
    const user = users.find(u => u._id === call.user_id);
    
    const matchesSearch = 
      lead?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesResult = resultFilter === 'all' || call.result === resultFilter;

    return matchesSearch && matchesResult;
  });

  const resultLabels: Record<string, Record<string, string>> = {
    answered: { ar: 'رد على المكالمة', en: 'Answered' },
    no_answer: { ar: 'لم يرد', en: 'No Answer' },
    busy: { ar: 'مشغول', en: 'Busy' },
    rejected: { ar: 'رفض', en: 'Rejected' },
    voicemail: { ar: 'بريد صوتي', en: 'Voicemail' },
  };

  const resultColors: Record<string, string> = {
    answered: 'bg-green-100 text-green-800',
    no_answer: 'bg-yellow-100 text-yellow-800',
    busy: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    voicemail: 'bg-blue-100 text-blue-800',
  };

  // Calculate stats
  const stats = getStats();
  const totalCalls = stats.totalCalls;
  const answeredCalls = stats.answeredCalls;
  const avgDuration = totalCalls > 0 ? Math.round(stats.totalDuration / totalCalls) : 0;
  const contactRate = stats.contactRate.toFixed(1);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
          <PhoneCall className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t('calls_log')}</h1>
          <p className="text-gray-500">{t('all_recorded_calls')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('total_calls')}</CardTitle>
              <PhoneCall className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCalls}</div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('successful_calls')}</CardTitle>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{answeredCalls}</div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('contact_rate')}</CardTitle>
              <Target className="h-8 w-8 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contactRate}%</div>
          </CardContent>
        </Card>

        <Card className="stats-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{t('average_duration')}</CardTitle>
              <Timer className="h-8 w-8 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgDuration}{t('seconds')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">{t('search')}</label>
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن شركة أو موظف...' : 'Search for company or employee...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={language === 'ar' ? 'pr-10' : 'pl-10'}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">{t('result')}</label>
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="answered">{language === 'ar' ? 'رد' : 'Answered'}</SelectItem>
              <SelectItem value="no_answer">{language === 'ar' ? 'لم يرد' : 'No Answer'}</SelectItem>
              <SelectItem value="busy">{language === 'ar' ? 'مشغول' : 'Busy'}</SelectItem>
              <SelectItem value="rejected">{language === 'ar' ? 'رفض' : 'Rejected'}</SelectItem>
              <SelectItem value="voicemail">{language === 'ar' ? 'بريد صوتي' : 'Voicemail'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date_time')}</TableHead>
                <TableHead>{t('company')}</TableHead>
                <TableHead>{t('employee')}</TableHead>
                <TableHead>{t('result')}</TableHead>
                <TableHead>{t('duration')}</TableHead>
                <TableHead>{t('notes')}</TableHead>
                <TableHead>{t('next_followup')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => {
                const lead = leads.find(l => l._id === call.lead_id);
                const user = users.find(u => u._id === call.user_id);
                
                return (
                  <TableRow key={call._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {new Date(call.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(call.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead?.company_name}</div>
                        <div className="text-sm text-gray-500" dir="ltr">{lead?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {user?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={resultColors[call.result]}>
                        {resultLabels[call.result]?.[language] || resultLabels[call.result]?.['ar']}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {call.duration}{t('seconds')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600">
                        {call.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.next_followup ? (
                        <div className="text-sm text-blue-600">
                          {new Date(call.next_followup).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}