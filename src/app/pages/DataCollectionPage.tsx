import { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import {
  Globe,
  Search,
  Download,
  Phone,
  Mail,
  Building,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  Sparkles,
  Map,
  MapPin,
  Zap,
  Layers,
} from 'lucide-react';

interface ScrapedLead {
  company_name: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  city: string;
  source: 'gmaps';
  address?: string;
  rating?: number;
  selected?: boolean;
  alreadySaved?: boolean;
}

const CITIES_AR = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا',
  'الزقازيق', 'أسيوط', 'الأقصر', 'أسوان', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'دمياط', 'المنيا', 'سوهاج',
  'بني سويف', 'الفيوم', 'شبين الكوم', 'كفر الشيخ', 'مرسى مطروح',
  'قنا', 'الغردقة', 'شرم الشيخ', 'بنها',
];

const INDUSTRIES_AR = [
  { label: 'عيادات', value: 'عيادات' },
  { label: 'مستشفيات', value: 'مستشفيات' },
  { label: 'صيدليات', value: 'صيدليات' },
  { label: 'مطاعم', value: 'مطاعم' },
  { label: 'كافيهات', value: 'كافيهات' },
  { label: 'فنادق', value: 'فنادق' },
  { label: 'مقاولات', value: 'مقاولات' },
  { label: 'تعليم / مدارس', value: 'تعليم' },
  { label: 'جامعات', value: 'جامعات' },
  { label: 'بنوك', value: 'بنوك' },
  { label: 'سوبرماركت', value: 'سوبرماركت' },
  { label: 'صالونات تجميل', value: 'صالونات' },
  { label: 'مراكز رياضية', value: 'رياضة' },
  { label: 'مكاتب / شركات', value: 'مكاتب' },
];

export default function DataCollectionPage() {
  const { users, settings } = useCRM();
  const { language } = useLanguage();
  const { user } = useAuth();

  const [industry, setIndustry] = useState('عيادات');

  // Google Maps direct scrape params
  const [gmapsQuery, setGmapsQuery] = useState('');
  const [gmapsCity, setGmapsCity] = useState('القاهرة');
  const [gmapsMaxResults] = useState('10000');
  const [comprehensive, setComprehensive] = useState(false);
  const [queriesRun, setQueriesRun] = useState(0);
  const [queryStats, setQueryStats] = useState<{ query: string; found: number; new: number }[]>([]);

  // Results state
  const [results, setResults] = useState<ScrapedLead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchStats, setSearchStats] = useState<{ total: number; withPhone: number; source: string; totalScraped?: number; newLeads?: number; alreadySaved?: number; queriesRun?: number } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: number; duplicates: number; noPhone: number; failed: number } | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  const selectedCount = results.filter(r => r.selected).length;
  const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'admin');

  // Search Google Maps — uses SSE streaming for real-time results
  const searchGMaps = async () => {
    setIsSearching(true);
    setSaveResult(null);
    setResults([]);
    setSearchStats(null);
    setQueryStats([]);
    setQueriesRun(0);
    setProgressMsg(language === 'ar' ? 'جاري الاتصال...' : 'Connecting...');
    setProgressPercent(0);

    const query = gmapsQuery || `${industry} في ${gmapsCity}`;
    const maxRes = parseInt(gmapsMaxResults) || 40;

    // Build SSE URL with query params
    const params = new URLSearchParams({
      searchQuery: query,
      city: gmapsCity,
      industry,
      maxResults: String(maxRes),
      comprehensive: String(comprehensive),
    });

    const eventSource = new EventSource(`/api/scrape/gmaps/stream?${params.toString()}`);

    eventSource.addEventListener('status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setProgressMsg(data.message);
    });

    eventSource.addEventListener('progress', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setProgressMsg(data.message);
      if (data.totalQueries > 1) {
        setProgressPercent(Math.round(((data.queryIndex) / data.totalQueries) * 100));
      }
    });

    eventSource.addEventListener('results', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      const newLeads: ScrapedLead[] = data.leads.map((r: ScrapedLead & { alreadySaved?: boolean }) => ({
        ...r,
        selected: !r.alreadySaved,
      }));
      // Append new results to existing
      setResults(prev => [...prev, ...newLeads]);
      if (data.areaStat) {
        setQueryStats(prev => [...prev, data.areaStat]);
      }
    });

    eventSource.addEventListener('stats', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setSearchStats({
        total: data.withPhone,
        totalScraped: data.totalScraped,
        withPhone: data.withPhone,
        newLeads: data.newLeads,
        alreadySaved: data.alreadySaved,
        queriesRun: data.queriesCompleted,
        source: comprehensive ? 'Google Maps (بحث شامل)' : 'Google Maps',
      });
      setQueriesRun(data.queriesCompleted);
      if (data.totalQueries > 1) {
        setProgressPercent(Math.round((data.queriesCompleted / data.totalQueries) * 100));
      }
    });

    eventSource.addEventListener('areaError', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setQueryStats(prev => [...prev, { query: data.query, found: 0, new: 0 }]);
    });

    eventSource.addEventListener('done', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      eventSource.close();
      setIsSearching(false);
      setProgressMsg('');
      setProgressPercent(100);
      setQueriesRun(data.queriesRun || 1);
      setSearchStats({
        total: data.total,
        totalScraped: data.totalScraped,
        withPhone: data.withPhone,
        newLeads: data.newLeads,
        alreadySaved: data.alreadySaved,
        queriesRun: data.queriesRun,
        source: comprehensive ? 'Google Maps (بحث شامل)' : 'Google Maps',
      });
      const newCount = data.newLeads ?? data.total;
      toast.success(language === 'ar'
        ? `تم العثور على ${newCount} عميل جديد من Google Maps`
        : `Found ${newCount} new leads from Google Maps`);
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        toast.error(data.error || 'خطأ في البحث');
      } catch {
        // SSE connection error
      }
      eventSource.close();
      setIsSearching(false);
      setProgressMsg('');
    });

    eventSource.onerror = () => {
      // This fires when the stream ends or on connection error
      if (eventSource.readyState === EventSource.CLOSED) return;
      eventSource.close();
      setIsSearching(false);
      setProgressMsg('');
    };
  };

  // Save selected leads to database
  const saveLeads = async () => {
    const selected = results.filter(r => r.selected);
    if (selected.length === 0) {
      toast.error(language === 'ar' ? 'يرجى اختيار عملاء محتملين أولاً' : 'Please select leads first');
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const res = await fetch('/api/scrape/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: selected,
          assignTo: assignTo || user?._id || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل الحفظ');
      }

      const data = await res.json();
      setSaveResult(data);

      if (data.success > 0) {
        toast.success(language === 'ar'
          ? `تم حفظ ${data.success} عميل محتمل في قاعدة البيانات`
          : `Saved ${data.success} leads to database`);
        // Remove saved leads from results
        setResults(prev => prev.filter(r => !r.selected));
      }
      if (data.duplicates > 0) {
        toast.warning(language === 'ar'
          ? `${data.duplicates} عميل مكرر تم تجاهلهم`
          : `${data.duplicates} duplicates skipped`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle all selections
  const toggleAll = (checked: boolean) => {
    setResults(prev => prev.map(r => ({ ...r, selected: checked })));
  };

  const toggleOne = (idx: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <Globe className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'جمع البيانات' : 'Data Collection'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'جمع بيانات العملاء المحتملين من Google Maps'
                : 'Collect potential leads from Google Maps'}
            </p>
          </div>
        </div>
      </div>

      {/* Google Maps Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            {language === 'ar' ? 'البحث في Google Maps' : 'Search Google Maps'}
          </CardTitle>
          <CardDescription>
            {language === 'ar'
              ? 'جمع بيانات الأماكن مباشرة من Google Maps — بدون مفتاح API'
              : 'Collect business data directly from Google Maps — no API key needed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>{language === 'ar' ? 'كلمة البحث' : 'Search Query'}</Label>
              <Input
                placeholder={language === 'ar' ? 'مثال: عيادات أسنان في القاهرة' : 'e.g. dental clinics in Cairo'}
                value={gmapsQuery}
                onChange={e => setGmapsQuery(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ar'
                  ? 'اتركه فارغاً لاستخدام النشاط والمدينة المحددين'
                  : 'Leave empty to use selected industry + city'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'المدينة' : 'City'}</Label>
              <Select value={gmapsCity} onValueChange={setGmapsCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES_AR.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comprehensive Search Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/10">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="comprehensive" className="font-semibold cursor-pointer">
                    {language === 'ar' ? 'بحث شامل (جميع المناطق)' : 'Comprehensive Search (All Areas)'}
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    MAX
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {language === 'ar'
                    ? `بحث تلقائي في جميع أحياء ومناطق المدينة للحصول على أكبر عدد من النتائج — يستغرق وقتاً أطول`
                    : 'Automatically searches all city neighborhoods for maximum results — takes longer'}
                </p>
              </div>
            </div>
            <Switch
              id="comprehensive"
              checked={comprehensive}
              onCheckedChange={setComprehensive}
            />
          </div>

          {comprehensive && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                {language === 'ar'
                  ? `سيتم البحث في المدينة الرئيسية + جميع الأحياء والمناطق الفرعية تلقائياً. قد يستغرق البحث عدة دقائق.`
                  : 'Will search main city + all sub-areas automatically. This may take several minutes.'}
              </span>
            </div>
          )}

          <Button onClick={searchGMaps} disabled={isSearching} className="gap-2" size="lg">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : comprehensive ? (
              <Layers className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isSearching
              ? (language === 'ar'
                ? (comprehensive ? 'جاري البحث الشامل...' : 'جاري البحث...')
                : (comprehensive ? 'Comprehensive search in progress...' : 'Searching...'))
              : (language === 'ar'
                ? (comprehensive ? 'بحث شامل في Google Maps' : 'بحث في Google Maps')
                : (comprehensive ? 'Comprehensive Google Maps Search' : 'Search Google Maps'))}
          </Button>

          {/* Live Progress Bar */}
          {isSearching && progressMsg && (
            <div className="space-y-2 p-4 rounded-xl border bg-gradient-to-r from-blue-500/5 to-green-500/5 animate-in fade-in">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="font-medium">{progressMsg}</span>
                </div>
                {comprehensive && progressPercent > 0 && (
                  <span className="text-muted-foreground font-mono text-xs">
                    {progressPercent}%
                  </span>
                )}
              </div>
              {comprehensive && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(progressPercent, 2)}%` }}
                  />
                </div>
              )}
              {results.length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  {language === 'ar' 
                    ? `✓ تم العثور على ${results.length} نتيجة حتى الآن...`
                    : `✓ Found ${results.length} results so far...`}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Stats */}
      {searchStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{searchStats.totalScraped || searchStats.total}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي النتائج' : 'Total Scraped'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Phone className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{searchStats.withPhone}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لديهم رقم هاتف' : 'With Phone Number'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{searchStats.newLeads ?? searchStats.total}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'عملاء جدد' : 'New Leads'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{searchStats.alreadySaved || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'محفوظ مسبقاً' : 'Already Saved'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comprehensive Search Area Breakdown */}
      {queryStats.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              {language === 'ar' ? `تفاصيل البحث الشامل (${queryStats.length} منطقة)` : `Comprehensive Search Details (${queryStats.length} areas)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {queryStats.map((qs, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg text-xs border ${qs.new > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30 border-muted'}`}>
                  <span className="truncate font-medium" title={qs.query}>
                    {qs.query.length > 25 ? qs.query.slice(0, 25) + '…' : qs.query}
                  </span>
                  <Badge variant={qs.new > 0 ? 'default' : 'secondary'} className="text-xs ml-1 shrink-0">
                    {qs.new}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Result Banner */}
      {saveResult && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully'}
              </h3>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-green-600 font-medium">✓ {saveResult.success} {language === 'ar' ? 'تم حفظهم' : 'saved'}</span>
              {saveResult.duplicates > 0 && <span className="text-yellow-600">⚠ {saveResult.duplicates} {language === 'ar' ? 'مكرر' : 'duplicates'}</span>}
              {saveResult.noPhone > 0 && <span className="text-orange-600">📵 {saveResult.noPhone} {language === 'ar' ? 'بدون هاتف' : 'no phone'}</span>}
              {saveResult.failed > 0 && <span className="text-red-600">✗ {saveResult.failed} {language === 'ar' ? 'فشل' : 'failed'}</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {language === 'ar' ? `النتائج (${results.length})` : `Results (${results.length})`}
              </CardTitle>
              <div className="flex items-center gap-3">
                {/* Assign To */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">
                    {language === 'ar' ? 'تعيين إلى:' : 'Assign to:'}
                  </Label>
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={language === 'ar' ? 'اختر موظف' : 'Select user'} />
                    </SelectTrigger>
                    <SelectContent>
                      {salesUsers.map(u => (
                        <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={saveLeads}
                  disabled={isSaving || selectedCount === 0}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {language === 'ar'
                    ? `حفظ ${selectedCount} عميل في قاعدة البيانات`
                    : `Save ${selectedCount} leads to database`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={results.every(r => r.selected)}
                        onCheckedChange={(checked) => toggleAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>{language === 'ar' ? 'اسم الشركة' : 'Company'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الهاتف' : 'Phone'}</TableHead>
                    <TableHead>{language === 'ar' ? 'البريد' : 'Email'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المدينة' : 'City'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النشاط' : 'Industry'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((lead, idx) => (
                    <TableRow key={idx} className={lead.alreadySaved ? 'opacity-40 bg-muted/30' : lead.selected ? '' : 'opacity-50'}>
                      <TableCell>
                        <Checkbox
                          checked={lead.selected}
                          onCheckedChange={() => toggleOne(idx)}
                          disabled={lead.alreadySaved}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                          {lead.company_name}
                          {lead.alreadySaved && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-500/30 text-xs shrink-0">
                              {language === 'ar' ? 'محفوظ' : 'Saved'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Phone className="h-3 w-3" />
                            <span dir="ltr">{lead.phone}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                            {language === 'ar' ? 'غير متوفر' : 'N/A'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{lead.city}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.industry}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isSearching && results.length === 0 && !searchStats && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Globe className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              {language === 'ar' ? 'ابدأ بالبحث عن عملاء محتملين' : 'Start searching for potential leads'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {language === 'ar'
                ? 'اختر المدينة والنشاط التجاري ثم اضغط بحث لجمع بيانات العملاء المحتملين تلقائياً من الخرائط'
                : 'Select a city and industry, then click Search to automatically collect lead data from maps'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
