import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Phone, 
  UserPlus, 
  Calendar, 
  Edit, 
  Trash2,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCRM, Activity } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ActivityTimelinePage() {
  const { activities, users, leads } = useCRM();
  const { language } = useLanguage();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-5 h-5 text-blue-500" />;
      case 'lead_created':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'lead_updated':
        return <Edit className="w-5 h-5 text-orange-500" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'email':
        return <Mail className="w-5 h-5 text-red-500" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'note':
        return <Edit className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 border-blue-200';
      case 'lead_created':
        return 'bg-green-100 border-green-200';
      case 'lead_updated':
        return 'bg-orange-100 border-orange-200';
      case 'meeting':
        return 'bg-purple-100 border-purple-200';
      case 'email':
        return 'bg-red-100 border-red-200';
      case 'whatsapp':
        return 'bg-green-100 border-green-200';
      case 'note':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return language === 'ar' ? 'مكالمة' : 'Call';
      case 'lead_created':
        return language === 'ar' ? 'عميل جديد' : 'New Lead';
      case 'lead_updated':
        return language === 'ar' ? 'تحديث' : 'Update';
      case 'meeting':
        return language === 'ar' ? 'اجتماع' : 'Meeting';
      case 'email':
        return language === 'ar' ? 'بريد إلكتروني' : 'Email';
      case 'whatsapp':
        return language === 'ar' ? 'واتساب' : 'WhatsApp';
      case 'note':
        return language === 'ar' ? 'ملاحظة' : 'Note';
      default:
        return type;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.type !== filterType) return false;
    if (filterUser !== 'all' && activity.user_id !== filterUser) return false;
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !activity.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(new Date(activity.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <Clock className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{language === 'ar' ? 'سجل الأنشطة' : 'Activity Log'}</h1>
            <p className="text-muted-foreground">{language === 'ar' ? 'تتبع جميع الأنشطة والتفاعلات' : 'Track all activities and interactions'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'البحث في الأنشطة...' : 'Search activities...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'نوع النشاط' : 'Activity Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</SelectItem>
                <SelectItem value="call">{language === 'ar' ? 'المكالمات' : 'Calls'}</SelectItem>
                <SelectItem value="lead_created">{language === 'ar' ? 'عملاء جدد' : 'New Leads'}</SelectItem>
                <SelectItem value="lead_updated">{language === 'ar' ? 'التحديثات' : 'Updates'}</SelectItem>
                <SelectItem value="meeting">{language === 'ar' ? 'الاجتماعات' : 'Meetings'}</SelectItem>
                <SelectItem value="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</SelectItem>
                <SelectItem value="whatsapp">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</SelectItem>
                <SelectItem value="note">{language === 'ar' ? 'الملاحظات' : 'Notes'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'الموظف' : 'Employee'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الموظفين' : 'All Employees'}</SelectItem>
                {users.map(user => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الأنشطة' : 'Total Activities'}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'المكالمات' : 'Calls'}</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.type === 'call').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'عملاء جدد' : 'New Leads'}</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.type === 'lead_created').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'الاجتماعات' : 'Meetings'}</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.type === 'meeting').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{language === 'ar' ? 'لا توجد أنشطة مطابقة للفلاتر المحددة' : 'No activities matching the selected filters'}</p>
            </CardContent>
          </Card>
        ) : (
          Object.keys(groupedActivities)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(date => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold text-lg">
                    {format(new Date(date), 'EEEE، d MMMM yyyy', { locale: language === 'ar' ? ar : undefined })}
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <Badge variant="outline">
                    {groupedActivities[date].length} {language === 'ar' ? 'نشاط' : 'activities'}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {groupedActivities[date].map((activity, index) => {
                    const user = users.find(u => u._id === activity.user_id);
                    const lead = activity.lead_id ? leads.find(l => l._id === activity.lead_id) : null;

                    return (
                      <div key={activity.id} className="flex gap-4">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < groupedActivities[date].length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200 my-1"></div>
                          )}
                        </div>

                        {/* Activity Content */}
                        <Card className="flex-1 mb-4">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {getTypeLabel(activity.type)}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(activity.timestamp), 'h:mm a', { locale: language === 'ar' ? ar : undefined })}
                                  </span>
                                </div>

                                <h4 className="font-semibold mb-1">{activity.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {activity.description}
                                </p>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-xs bg-blue-100">
                                        {user?.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-muted-foreground">{user?.name}</span>
                                  </div>

                                  {lead && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">{lead.company_name}</span>
                                    </>
                                  )}

                                  {activity.metadata?.duration !== undefined && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span className="text-muted-foreground">
                                        {Math.floor(activity.metadata.duration / 60)}:{(activity.metadata.duration % 60).toString().padStart(2, '0')} {language === 'ar' ? 'دقيقة' : 'min'}
                                      </span>
                                    </>
                                  )}

                                  {activity.metadata?.result && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <Badge 
                                        variant={activity.metadata.result === 'answered' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {activity.metadata.result === 'answered' ? (language === 'ar' ? 'تم الرد' : 'Answered') : (language === 'ar' ? 'لم يرد' : 'No Answer')}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
