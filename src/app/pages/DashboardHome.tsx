import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { PhoneCall, Users, TrendingUp, CheckCircle, Phone, PhoneOff, Sparkles } from 'lucide-react';

// Custom Tooltip with RTL support
const CustomTooltip = ({ active, payload, label, language }: TooltipProps<any, any> & { language: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label for Pie Chart with RTL support
const renderCustomLabel = (props: any, language: string) => {
  const { cx, cy, midAngle, outerRadius, name, value, fill } = props;
  const RADIAN = Math.PI / 180;
  // Increase radius significantly for better spacing
  const radius = outerRadius + 45;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Text anchor based on position
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text 
      x={x} 
      y={y} 
      fill={fill}
      textAnchor={textAnchor}
      dominantBaseline="central"
      className="text-xs font-medium"
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
    >
      {`${name}: ${value}`}
    </text>
  );
};

export default function DashboardHome() {
  const { t, language } = useLanguage();
  const { leads, calls, users, getStats } = useCRM();
  const { user } = useAuth();

  // Check if user is admin or manager
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // For sales users, filter to show only their assigned leads
  const filteredLeads = user?.role === 'sales' 
    ? leads.filter(l => l.assigned_to === user._id)
    : leads;

  // Calculate statistics
  const stats = getStats();
  // For sales users, use filtered leads count; for admin/manager, use total
  const totalLeads = user?.role === 'sales' ? filteredLeads.length : stats.totalLeads;
  const totalCalls = stats.totalCalls;
  const contactRate = stats.contactRate.toFixed(1);
  const closedLeads = user?.role === 'sales' 
    ? filteredLeads.filter(l => l.status === 'closed').length 
    : stats.closedLeads;
  const conversionRate = totalLeads > 0 
    ? ((closedLeads / totalLeads) * 100).toFixed(1)
    : '0.0';

  // Status distribution - use filtered leads for sales users
  const statusData = [
    { name: language === 'ar' ? 'جديد' : 'New', value: filteredLeads.filter(l => l.status === 'new').length, color: 'rgba(147, 167, 255, 0.7)' },
    { name: language === 'ar' ? 'تم التواصل' : 'Contacted', value: filteredLeads.filter(l => l.status === 'contacted').length, color: 'rgba(103, 232, 249, 0.7)' },
    { name: language === 'ar' ? 'متابعة' : 'Follow-up', value: filteredLeads.filter(l => l.status === 'followup').length, color: 'rgba(251, 191, 36, 0.7)' },
    { name: language === 'ar' ? 'اجتماع' : 'Meeting', value: filteredLeads.filter(l => l.status === 'meeting').length, color: 'rgba(110, 231, 183, 0.7)' },
    { name: language === 'ar' ? 'مغلق' : 'Closed', value: filteredLeads.filter(l => l.status === 'closed').length, color: 'rgba(52, 211, 153, 0.7)' },
    { name: language === 'ar' ? 'خسارة' : 'Lost', value: filteredLeads.filter(l => l.status === 'lost').length, color: 'rgba(252, 165, 165, 0.7)' },
  ];

  // Calls by result
  const callsData = [
    { name: language === 'ar' ? 'رد' : 'Answered', value: calls.filter(c => c.result === 'answered').length, color: 'rgba(110, 231, 183, 0.7)' },
    { name: language === 'ar' ? 'لم يرد' : 'No Answer', value: calls.filter(c => c.result === 'no_answer').length, color: 'rgba(251, 191, 36, 0.7)' },
    { name: language === 'ar' ? 'مشغول' : 'Busy', value: calls.filter(c => c.result === 'busy').length, color: 'rgba(252, 165, 165, 0.7)' },
    { name: language === 'ar' ? 'رفض' : 'Rejected', value: calls.filter(c => c.result === 'rejected').length, color: 'rgba(254, 202, 202, 0.7)' },
  ];

  // Sales performance - only for admin/manager
  const salesPerformance = users
    .filter(u => u.role === 'sales')
    .map(salesUser => {
      const userCalls = calls.filter(c => c.user_id === salesUser._id).length;
      const userLeads = leads.filter(l => l.assigned_to === salesUser._id && l.status === 'closed').length;
      return {
        name: salesUser.name,
        [language === 'ar' ? 'مكالمات' : 'Calls']: userCalls,
        [language === 'ar' ? 'صفقات' : 'Deals']: userLeads,
      };
    });

  // Industry distribution - only for admin/manager
  // Filter out empty/invalid industries and sort by count
  const industryCount = leads.reduce((acc, lead) => {
    const industry = lead.industry?.trim();
    if (industry && industry.length > 0) {
      acc[industry] = (acc[industry] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const industryData = Object.entries(industryCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 industries

  return (
    <div className="p-8 space-y-8">
      {/* Elite Header */}
      <div className="relative">
        <div className="absolute -top-4 -left-4 w-32 h-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}></div>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <PhoneCall className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-primary relative">{t('dashboard')}</h1>
            <p className="text-muted-foreground mt-2 relative">
              {language === 'ar' ? 'نظرة عامة على أداء النظام' : 'System Performance Overview'}
            </p>
          </div>
        </div>
      </div>

      {/* Elite KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover border-2 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('total_leads')}</CardTitle>
            <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(147, 167, 255, 0.3)' }}>
              <Users className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" style={{ color: 'rgba(102, 126, 234, 0.9)' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: 'rgba(102, 126, 234, 0.8)' }}>{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {language === 'ar' ? 'عميل محتمل' : 'Potential Customers'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-2 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('active_calls')}</CardTitle>
            <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(196, 167, 255, 0.3)' }}>
              <PhoneCall className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" style={{ color: 'rgba(139, 92, 246, 0.9)' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: 'rgba(139, 92, 246, 0.8)' }}>{totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {language === 'ar' ? 'مكالمة' : 'Calls'}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-2 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              {language === 'ar' ? 'معدل التواصل' : 'Contact Rate'}
            </CardTitle>
            <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(110, 231, 183, 0.3)' }}>
              <Phone className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" style={{ color: 'rgba(16, 185, 129, 0.9)' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: 'rgba(16, 185, 129, 0.8)' }}>{contactRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'ar' ? `من ${totalCalls} مكالمة` : `Out of ${totalCalls} calls`}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-2 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">{t('conversion_rate')}</CardTitle>
            <div className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(251, 191, 36, 0.3)' }}>
              <CheckCircle className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" style={{ color: 'rgba(245, 158, 11, 0.9)' }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" style={{ color: 'rgba(245, 158, 11, 0.8)' }}>{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {language === 'ar' ? `${closedLeads} صفقة مغلقة` : `${closedLeads} Closed Deals`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Elite Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="card-hover border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              {language === 'ar' ? 'توزيع حالة العملاء' : 'Lead Status Distribution'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'تصنيف العملاء حسب الحالة' : 'Classification by Status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => renderCustomLabel(entry, language)}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip language={language} />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Calls Results */}
        <Card className="card-hover border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-8 bg-success rounded-full"></div>
              {language === 'ar' ? 'نتائج المكالمات' : 'Call Results'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'توزيع نتائج المكالمات' : 'Call Outcomes Distribution'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={callsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" stroke="currentColor" opacity={0.5} />
                <YAxis stroke="currentColor" opacity={0.5} />
                <Tooltip content={<CustomTooltip language={language} />} />
                <Bar dataKey="value" fill="rgba(147, 167, 255, 0.7)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Performance - Only for Admin/Manager */}
        {isAdminOrManager && (
          <Card className="card-hover border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-8 rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 1)' }}></div>
                {language === 'ar' ? 'أداء فريق المبيعات' : 'Sales Team Performance'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'المكالمات والصفقات لكل موظف' : 'Calls & Deals per Employee'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={salesPerformance}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    opacity={0.5}
                    angle={language === 'ar' ? -15 : 0}
                    textAnchor={language === 'ar' ? 'end' : 'middle'}
                    height={60}
                  />
                  <YAxis stroke="currentColor" opacity={0.5} />
                  <Tooltip content={<CustomTooltip language={language} />} />
                  <Legend 
                    wrapperStyle={{ 
                      direction: language === 'ar' ? 'rtl' : 'ltr',
                      textAlign: language === 'ar' ? 'right' : 'left'
                    }}
                  />
                  <Bar dataKey={language === 'ar' ? 'مكالمات' : 'Calls'} fill="rgba(147, 167, 255, 0.7)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey={language === 'ar' ? 'صفقات' : 'Deals'} fill="rgba(110, 231, 183, 0.7)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Industry Distribution - Only for Admin/Manager */}
        {isAdminOrManager && (
          <Card className="card-hover border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-8 bg-warning rounded-full"></div>
                {language === 'ar' ? 'توزيع الصناعات' : 'Industry Distribution'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'العملاء حسب القطاع' : 'Customers by Sector'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart 
                  data={industryData} 
                  layout="vertical"
                  margin={{ top: 10, right: 40, left: 200, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    type="number" 
                    stroke="currentColor" 
                    opacity={0.5}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="currentColor" 
                    opacity={0.8}
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, textAnchor: 'end', fill: 'currentColor' }}
                    width={190}
                    interval={0}
                  />
                  <Tooltip content={<CustomTooltip language={language} />} />
                  <Bar 
                    dataKey="value" 
                    fill="rgba(251, 191, 36, 0.8)" 
                    radius={[0, 6, 6, 0]} 
                    barSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}