import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  UserCheck,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Users,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function EmployeePerformancePage() {
  const { leads, calls, users, activities, meetings } = useCRM();
  const { language } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager');

  // Date filtering
  const filterByDate = (dateStr: string) => {
    if (dateRange === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    switch (dateRange) {
      case 'today': {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return date >= todayStart;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      case 'month': {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return date >= monthAgo;
      }
      case 'quarter': {
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return date >= quarterAgo;
      }
      default: return true;
    }
  };

  // Calculate per-user performance
  const employeeStats = useMemo(() => {
    return salesUsers.map(user => {
      const userLeads = leads.filter(l => l.assigned_to === user._id);
      const userCalls = calls.filter(c => c.user_id === user._id && filterByDate(c.created_at));
      const userActivities = activities.filter(a => a.user_id === user._id && filterByDate(a.timestamp));
      const userMeetings = meetings.filter(m => m.user_id === user._id && filterByDate(m.meeting_date));

      const answeredCalls = userCalls.filter(c => c.result === 'answered').length;
      const noAnswerCalls = userCalls.filter(c => c.result === 'no_answer').length;
      const busyCalls = userCalls.filter(c => c.result === 'busy').length;
      const rejectedCalls = userCalls.filter(c => c.result === 'rejected').length;
      const totalDuration = userCalls.filter(c => c.result === 'answered').reduce((sum, c) => sum + c.duration, 0);
      const avgDuration = answeredCalls > 0 ? totalDuration / answeredCalls : 0;

      const closedLeads = userLeads.filter(l => l.status === 'closed').length;
      const lostLeads = userLeads.filter(l => l.status === 'lost').length;
      const followupLeads = userLeads.filter(l => l.status === 'followup').length;
      const meetingLeads = userLeads.filter(l => l.status === 'meeting').length;
      const newLeads = userLeads.filter(l => l.status === 'new').length;
      const contactedLeads = userLeads.filter(l => l.status === 'contacted').length;

      const contactRate = userCalls.length > 0 ? (answeredCalls / userCalls.length) * 100 : 0;
      const conversionRate = userLeads.length > 0 ? (closedLeads / userLeads.length) * 100 : 0;

      // Performance score (0-100)
      const callScore = Math.min(userCalls.length * 2, 30); // max 30 points
      const contactRateScore = contactRate * 0.3; // max 30 points
      const conversionScore = conversionRate * 0.4; // max 40 points
      const performanceScore = Math.round(callScore + contactRateScore + conversionScore);

      return {
        user,
        totalLeads: userLeads.length,
        totalCalls: userCalls.length,
        answeredCalls,
        noAnswerCalls,
        busyCalls,
        rejectedCalls,
        totalDuration,
        avgDuration,
        closedLeads,
        lostLeads,
        followupLeads,
        meetingLeads,
        newLeads,
        contactedLeads,
        contactRate,
        conversionRate,
        performanceScore,
        totalActivities: userActivities.length,
        totalMeetings: userMeetings.length,
        completedMeetings: userMeetings.filter(m => m.status === 'completed').length,
      };
    });
  }, [salesUsers, leads, calls, activities, meetings, dateRange]);

  const selectedEmployee = selectedUserId !== 'all'
    ? employeeStats.find(e => e.user._id === selectedUserId)
    : null;

  const getPerformanceColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 70) return { label: t('ممتاز', 'Excellent'), variant: 'default' as const, color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (score >= 40) return { label: t('متوسط', 'Average'), variant: 'secondary' as const, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    return { label: t('يحتاج تحسين', 'Needs Improvement'), variant: 'destructive' as const, color: 'bg-red-500/10 text-red-500 border-red-500/20' };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Overview comparison chart data
  const comparisonData = employeeStats.map(e => ({
    name: e.user.name,
    [t('المكالمات', 'Calls')]: e.totalCalls,
    [t('تم الرد', 'Answered')]: e.answeredCalls,
    [t('صفقات مغلقة', 'Closed')]: e.closedLeads,
    [t('خسارة', 'Lost')]: e.lostLeads,
  }));

  // Ranking
  const ranked = [...employeeStats].sort((a, b) => b.performanceScore - a.performanceScore);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <UserCheck className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('مراقبة أداء الموظفين', 'Employee Performance')}</h1>
            <p className="text-muted-foreground">{t('تتبع إنجازات وأداء كل موظف', 'Track achievements and performance of each employee')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-44">
              <Calendar className="h-4 w-4 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('كل الأوقات', 'All Time')}</SelectItem>
              <SelectItem value="today">{t('اليوم', 'Today')}</SelectItem>
              <SelectItem value="week">{t('آخر أسبوع', 'Last Week')}</SelectItem>
              <SelectItem value="month">{t('آخر شهر', 'Last Month')}</SelectItem>
              <SelectItem value="quarter">{t('آخر 3 أشهر', 'Last 3 Months')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-52">
              <Users className="h-4 w-4 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('جميع الموظفين', 'All Employees')}</SelectItem>
              {salesUsers.map(u => (
                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* If no specific employee selected — show overview */}
      {selectedUserId === 'all' ? (
        <>
          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                {t('ترتيب الموظفين حسب الأداء', 'Employee Rankings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>{t('الموظف', 'Employee')}</TableHead>
                    <TableHead className="text-center">{t('النقاط', 'Score')}</TableHead>
                    <TableHead className="text-center">{t('التقييم', 'Rating')}</TableHead>
                    <TableHead className="text-center">{t('العملاء', 'Leads')}</TableHead>
                    <TableHead className="text-center">{t('المكالمات', 'Calls')}</TableHead>
                    <TableHead className="text-center">{t('معدل الرد', 'Contact Rate')}</TableHead>
                    <TableHead className="text-center">{t('صفقات مغلقة', 'Closed')}</TableHead>
                    <TableHead className="text-center">{t('خسارة', 'Lost')}</TableHead>
                    <TableHead className="text-center">{t('معدل التحويل', 'Conversion')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((emp, idx) => {
                    const badge = getPerformanceBadge(emp.performanceScore);
                    return (
                      <TableRow key={emp.user._id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUserId(emp.user._id)}>
                        <TableCell className="text-center font-bold text-lg">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold">{emp.user.name}</span>
                            <span className="text-xs text-muted-foreground block">
                              {emp.user.role === 'sales' ? t('مبيعات', 'Sales') : t('مدير', 'Manager')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xl font-bold ${getPerformanceColor(emp.performanceScore)}`}>
                            {emp.performanceScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={badge.color}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{emp.totalLeads}</TableCell>
                        <TableCell className="text-center">{emp.totalCalls}</TableCell>
                        <TableCell className="text-center">{emp.contactRate.toFixed(0)}%</TableCell>
                        <TableCell className="text-center text-green-500 font-semibold">{emp.closedLeads}</TableCell>
                        <TableCell className="text-center text-red-500 font-semibold">{emp.lostLeads}</TableCell>
                        <TableCell className="text-center">{emp.conversionRate.toFixed(0)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('مقارنة أداء الموظفين', 'Employee Comparison')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={t('المكالمات', 'Calls')} fill="rgba(147, 167, 255, 0.7)" />
                  <Bar dataKey={t('تم الرد', 'Answered')} fill="rgba(110, 231, 183, 0.7)" />
                  <Bar dataKey={t('صفقات مغلقة', 'Closed')} fill="rgba(196, 167, 255, 0.7)" />
                  <Bar dataKey={t('خسارة', 'Lost')} fill="rgba(248, 113, 113, 0.7)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : selectedEmployee && (
        <>
          {/* Employee Detail View */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Performance Score */}
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('نقاط الأداء', 'Performance Score')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2">
                <div className={`text-5xl font-bold ${getPerformanceColor(selectedEmployee.performanceScore)}`}>
                  {selectedEmployee.performanceScore}
                </div>
                <Badge className={getPerformanceBadge(selectedEmployee.performanceScore).color}>
                  {getPerformanceBadge(selectedEmployee.performanceScore).label}
                </Badge>
                <Progress value={selectedEmployee.performanceScore} className="mt-2" />
              </CardContent>
            </Card>

            {/* Total Calls */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('إجمالي المكالمات', 'Total Calls')}</CardTitle>
                <Phone className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{selectedEmployee.totalCalls}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`${selectedEmployee.answeredCalls} تم الرد`, `${selectedEmployee.answeredCalls} answered`)}
                </p>
              </CardContent>
            </Card>

            {/* Contact Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('معدل الرد', 'Contact Rate')}</CardTitle>
                {selectedEmployee.contactRate >= 50
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />
                }
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{selectedEmployee.contactRate.toFixed(1)}%</div>
                <Progress value={selectedEmployee.contactRate} className="mt-2" />
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('معدل التحويل', 'Conversion Rate')}</CardTitle>
                <Target className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{selectedEmployee.conversionRate.toFixed(1)}%</div>
                <Progress value={selectedEmployee.conversionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Second Row KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('العملاء المُسندين', 'Assigned Leads')}</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedEmployee.totalLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('صفقات مغلقة', 'Closed Deals')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{selectedEmployee.closedLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('عملاء خاسرين', 'Lost Leads')}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{selectedEmployee.lostLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('متوسط المكالمة', 'Avg Call Duration')}</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(selectedEmployee.avgDuration)}</div>
                <p className="text-xs text-muted-foreground">{t('دقيقة', 'min')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('الاجتماعات', 'Meetings')}</CardTitle>
                <Calendar className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedEmployee.totalMeetings}</div>
                <p className="text-xs text-muted-foreground">
                  {t(`${selectedEmployee.completedMeetings} مكتمل`, `${selectedEmployee.completedMeetings} completed`)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Call Results Pie */}
            <Card>
              <CardHeader>
                <CardTitle>{t('نتائج المكالمات', 'Call Results')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('تم الرد', 'Answered'), value: selectedEmployee.answeredCalls, color: 'rgba(34, 197, 94, 1)' },
                        { name: t('لم يرد', 'No Answer'), value: selectedEmployee.noAnswerCalls, color: 'rgba(245, 158, 11, 1)' },
                        { name: t('مشغول', 'Busy'), value: selectedEmployee.busyCalls, color: 'rgba(239, 68, 68, 1)' },
                        { name: t('رفض', 'Rejected'), value: selectedEmployee.rejectedCalls, color: 'rgba(168, 85, 247, 1)' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {[
                        { color: 'rgba(34, 197, 94, 1)' },
                        { color: 'rgba(245, 158, 11, 1)' },
                        { color: 'rgba(239, 68, 68, 1)' },
                        { color: 'rgba(168, 85, 247, 1)' },
                      ].filter((_, i) => [
                        selectedEmployee.answeredCalls,
                        selectedEmployee.noAnswerCalls,
                        selectedEmployee.busyCalls,
                        selectedEmployee.rejectedCalls,
                      ][i] > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('حالة العملاء', 'Lead Status')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: t('جديد', 'New'), value: selectedEmployee.newLeads, color: 'bg-blue-500', total: selectedEmployee.totalLeads },
                    { label: t('تم التواصل', 'Contacted'), value: selectedEmployee.contactedLeads, color: 'bg-cyan-500', total: selectedEmployee.totalLeads },
                    { label: t('متابعة', 'Follow-up'), value: selectedEmployee.followupLeads, color: 'bg-yellow-500', total: selectedEmployee.totalLeads },
                    { label: t('اجتماع', 'Meeting'), value: selectedEmployee.meetingLeads, color: 'bg-violet-500', total: selectedEmployee.totalLeads },
                    { label: t('مغلق', 'Closed'), value: selectedEmployee.closedLeads, color: 'bg-green-500', total: selectedEmployee.totalLeads },
                    { label: t('خسارة', 'Lost'), value: selectedEmployee.lostLeads, color: 'bg-red-500', total: selectedEmployee.totalLeads },
                  ].map(item => {
                    const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.value} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {t('نقاط القوة', 'Strengths')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedEmployee.contactRate >= 50 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{t('معدل رد مرتفع على المكالمات', 'High call answer rate')}</span>
                    </div>
                  )}
                  {selectedEmployee.conversionRate >= 20 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{t('معدل تحويل جيد', 'Good conversion rate')}</span>
                    </div>
                  )}
                  {selectedEmployee.totalCalls >= 10 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{t('عدد مكالمات جيد', 'Good call volume')}</span>
                    </div>
                  )}
                  {selectedEmployee.avgDuration >= 120 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{t('مدة مكالمات كافية للإقناع', 'Sufficient call duration for persuasion')}</span>
                    </div>
                  )}
                  {selectedEmployee.contactRate < 50 && selectedEmployee.conversionRate < 20 && selectedEmployee.totalCalls < 10 && (
                    <p className="text-muted-foreground text-sm">{t('لا توجد نقاط قوة بارزة حالياً', 'No notable strengths currently')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  {t('نقاط تحتاج تحسين', 'Areas for Improvement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedEmployee.contactRate < 50 && selectedEmployee.totalCalls > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span>{t('معدل الرد منخفض — يُنصح بتحسين أوقات الاتصال', 'Low contact rate — try different calling times')}</span>
                    </div>
                  )}
                  {selectedEmployee.totalCalls < 5 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span>{t('عدد المكالمات قليل — يحتاج زيادة النشاط', 'Few calls — needs more activity')}</span>
                    </div>
                  )}
                  {selectedEmployee.lostLeads > selectedEmployee.closedLeads && selectedEmployee.totalLeads > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10">
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      <span>{t('خسائر العملاء أكثر من الصفقات المغلقة', 'More lost leads than closed deals')}</span>
                    </div>
                  )}
                  {selectedEmployee.newLeads > 0 && selectedEmployee.totalLeads > 0 && (selectedEmployee.newLeads / selectedEmployee.totalLeads) > 0.5 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span>{t('نسبة كبيرة من العملاء لم يتم التواصل معهم بعد', 'High percentage of leads not yet contacted')}</span>
                    </div>
                  )}
                  {selectedEmployee.avgDuration < 60 && selectedEmployee.answeredCalls > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                      <span>{t('مدة المكالمات قصيرة — يحتاج تحسين مهارات التحدث', 'Short call duration — needs better talking skills')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t('آخر الأنشطة', 'Recent Activities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities
                .filter(a => a.user_id === selectedEmployee.user._id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map(activity => (
                  <div key={activity.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      {activity.description && <p className="text-xs text-muted-foreground truncate">{activity.description}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(activity.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              }
              {activities.filter(a => a.user_id === selectedEmployee.user._id).length === 0 && (
                <p className="text-muted-foreground text-center py-6">{t('لا توجد أنشطة مسجلة', 'No activities recorded')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
