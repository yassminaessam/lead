import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  Phone, 
  UserPlus, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'call' | 'lead' | 'meeting' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'call',
    title: 'مكالمة فائتة',
    message: 'لم يتم الرد على مكالمة من شركة المقاولات العربية',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    type: 'lead',
    title: 'عميل محتمل جديد',
    message: 'تم إضافة عيادة النور الطبية من مصدر Apify',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'meeting',
    title: 'تذكير باجتماع',
    message: 'اجتماع مع شركة السياحة المصرية بعد ساعة',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    priority: 'high',
  },
  {
    id: '4',
    type: 'system',
    title: 'نسخة احتياطية مكتملة',
    message: 'تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: true,
    priority: 'low',
  },
  {
    id: '5',
    type: 'lead',
    title: 'تحديث حالة عميل',
    message: 'تم تحويل شركة البناء الحديث إلى حالة "مغلق"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    priority: 'medium',
  },
];

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-500" />;
      case 'lead':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <Info className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-r-4 border-red-500';
      case 'medium':
        return 'border-r-4 border-orange-500';
      case 'low':
        return 'border-r-4 border-gray-300';
      default:
        return '';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -left-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p>لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  } ${getPriorityColor(notification.priority)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                          {!notification.read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          )}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50 text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              عرض جميع الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
