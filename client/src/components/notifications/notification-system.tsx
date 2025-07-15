import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Check, AlertCircle, Clock, CheckCircle, UserPlus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: 'audit_assigned' | 'audit_overdue' | 'action_assigned' | 'action_overdue' | 'team_update' | 'system_update';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionText?: string;
}

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  switch (type) {
    case 'audit_assigned':
    case 'audit_overdue':
      return <Calendar className="w-4 h-4" />;
    case 'action_assigned':
    case 'action_overdue':
      return <CheckCircle className="w-4 h-4" />;
    case 'team_update':
      return <UserPlus className="w-4 h-4" />;
    case 'system_update':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const NotificationBadge = ({ type, priority }: { type: Notification['type'], priority: Notification['priority'] }) => {
  const getColor = () => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'audit_assigned': return 'Audit';
      case 'audit_overdue': return 'Overdue';
      case 'action_assigned': return 'Action';
      case 'action_overdue': return 'Overdue';
      case 'team_update': return 'Team';
      case 'system_update': return 'System';
      default: return 'Info';
    }
  };

  return (
    <Badge variant="secondary" className={cn("text-white", getColor())}>
      {getTypeLabel()}
    </Badge>
  );
};

export function NotificationSystem() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications from API
  const { data: fetchedNotifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update local state when notifications are fetched
  useEffect(() => {
    if (fetchedNotifications.length > 0) {
      setNotifications(fetchedNotifications);
    }
  }, [fetchedNotifications]);

  // Generate sample notifications for demonstration
  useEffect(() => {
    if (user && notifications.length === 0) {
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          type: 'audit_assigned',
          title: 'New Audit Assigned',
          message: 'You have been assigned to conduct a 5S audit for Factory Zone 1 scheduled for tomorrow at 10:00 AM.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          isRead: false,
          priority: 'high',
          actionUrl: '/audits',
          actionText: 'View Audit'
        },
        {
          id: '2',
          type: 'action_overdue',
          title: 'Action Item Overdue',
          message: 'Action "Clean workstation area" assigned to you is now overdue. Please complete it as soon as possible.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false,
          priority: 'high',
          actionUrl: '/actions',
          actionText: 'View Actions'
        },
        {
          id: '3',
          type: 'team_update',
          title: 'Team Assignment Update',
          message: 'You have been added to the Galvanize team. Welcome to the team!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          isRead: true,
          priority: 'medium',
          actionUrl: '/teams',
          actionText: 'View Team'
        },
        {
          id: '4',
          type: 'system_update',
          title: 'System Maintenance',
          message: 'The system will undergo maintenance this weekend from 2:00 AM to 4:00 AM. Please plan accordingly.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isRead: true,
          priority: 'low'
        }
      ];
      setNotifications(sampleNotifications);
    }
  }, [user, notifications.length]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-sm"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors",
                          !notification.isRead && "bg-blue-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            notification.priority === 'high' ? 'bg-red-100 text-red-600' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          )}>
                            <NotificationIcon type={notification.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              <NotificationBadge type={notification.type} priority={notification.priority} />
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <div className="flex items-center gap-2">
                                {notification.actionUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      window.location.href = notification.actionUrl!;
                                      markAsRead(notification.id);
                                    }}
                                  >
                                    {notification.actionText || 'View'}
                                  </Button>
                                )}
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNotification(notification.id)}
                                  className="text-xs"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}