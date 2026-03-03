import { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar as CalendarIcon, Phone, Users, Clock } from 'lucide-react';

export default function CalendarPage() {
  const { calls, leads, meetings: crmMeetings } = useCRM();
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const unknownClient = language === 'ar' ? 'عميل غير معروف' : 'Unknown client';

  // Get follow-ups from calls
  const followUps = calls
    .filter(call => call.next_followup)
    .map(call => {
      const lead = leads.find(l => l._id === call.lead_id);
      return {
        id: call._id,
        type: 'followup' as const,
        date: call.next_followup!,
        title: lead?.company_name || unknownClient,
        phone: lead?.phone,
        notes: call.notes,
      };
    });

  // Get meetings
  const meetings = crmMeetings.map(meeting => {
    const lead = leads.find(l => l._id === meeting.lead_id);
    return {
      id: meeting._id,
      type: 'meeting' as const,
      date: meeting.meeting_date,
      title: lead?.company_name || unknownClient,
      notes: meeting.notes,
      status: meeting.status,
    };
  });

  // Combine and sort by date
  const allEvents = [...followUps, ...meetings].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group by date
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const eventsByDate: Record<string, typeof allEvents> = {};
  allEvents.forEach(event => {
    const dateKey = new Date(event.date).toLocaleDateString(locale);
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Get upcoming events (next 7 days)
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= now && eventDate <= weekFromNow;
  });

  // Today's events
  const today = new Date().toLocaleDateString(locale);
  const todayEvents = eventsByDate[today] || [];

  const followupLabel = language === 'ar' ? 'متابعة' : 'Follow-up';
  const meetingLabel = language === 'ar' ? 'اجتماع' : 'Meeting';

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
          <CalendarIcon className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{language === 'ar' ? 'التقويم والمتابعات' : 'Calendar & Follow-ups'}</h1>
          <p className="text-gray-500">{language === 'ar' ? 'جدول المكالمات والاجتماعات القادمة' : 'Upcoming calls and meetings schedule'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'اليوم' : 'Today'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'مهمة' : 'tasks'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{upcomingEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'مهمة قادمة' : 'upcoming tasks'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي المتابعات' : 'Total Follow-ups'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{followUps.length}</div>
            <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'متابعة مجدولة' : 'scheduled follow-ups'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {language === 'ar' ? 'مهام اليوم' : "Today's Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{language === 'ar' ? 'لا توجد مهام اليوم' : 'No tasks today'}</p>
            ) : (
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <div key={event.id} className="border-r-4 border-blue-500 pr-4 pb-4 border-b last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.type === 'followup' ? (
                            <Phone className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 text-green-600" />
                          )}
                          <Badge variant={event.type === 'followup' ? 'default' : 'secondary'}>
                            {event.type === 'followup' ? followupLabel : meetingLabel}
                          </Badge>
                        </div>
                        <h3 className="font-medium">{event.title}</h3>
                        {'phone' in event && event.phone && (
                          <p className="text-sm text-gray-500" dir="ltr">{event.phone}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-2">{event.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {language === 'ar' ? 'المهام القادمة' : 'Upcoming Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{language === 'ar' ? 'لا توجد مهام قادمة' : 'No upcoming tasks'}</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="border-r-4 border-purple-500 pr-4 pb-4 border-b last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.type === 'followup' ? (
                            <Phone className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 text-green-600" />
                          )}
                          <Badge variant={event.type === 'followup' ? 'default' : 'secondary'}>
                            {event.type === 'followup' ? followupLabel : meetingLabel}
                          </Badge>
                        </div>
                        <h3 className="font-medium">{event.title}</h3>
                        {'phone' in event && event.phone && (
                          <p className="text-sm text-gray-500" dir="ltr">{event.phone}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {new Date(event.date).toLocaleDateString(locale, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    {event.notes && (
                      <p className="text-sm text-gray-600 mt-2">{event.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'جميع المهام' : 'All Tasks'}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(eventsByDate).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{language === 'ar' ? 'لا توجد مهام مجدولة' : 'No scheduled tasks'}</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(eventsByDate).map(([date, events]) => (
                <div key={date}>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" style={{ color: 'rgba(59, 130, 246, 0.9)' }} />
                    {date}
                  </h3>
                  <div className="space-y-3 mr-7">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg" style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.1)'
                      }}>
                        {event.type === 'followup' ? (
                          <Phone className="h-5 w-5 mt-1" style={{ color: 'rgba(59, 130, 246, 0.9)' }} />
                        ) : (
                          <Users className="h-5 w-5 mt-1" style={{ color: 'rgba(34, 197, 94, 0.9)' }} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.title}</span>
                            <Badge variant={event.type === 'followup' ? 'default' : 'secondary'} className="text-xs">
                              {event.type === 'followup' ? followupLabel : meetingLabel}
                            </Badge>
                          </div>
                          {'phone' in event && event.phone && (
                            <p className="text-sm text-muted-foreground" dir="ltr">{event.phone}</p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleTimeString(locale, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}