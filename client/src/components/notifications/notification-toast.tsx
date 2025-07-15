import { useEffect, useState } from "react";
import { Bell, X, Check, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Notification } from "./notification-system";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  onAction?: () => void;
}

export function NotificationToast({ notification, onDismiss, onAction }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss after 8 seconds
    const autoDismiss = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismiss);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'audit_assigned':
      case 'audit_overdue':
        return <Clock className="w-5 h-5" />;
      case 'action_assigned':
      case 'action_overdue':
        return <Check className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  const getIconColor = () => {
    switch (notification.priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 ease-in-out",
        isVisible && !isExiting ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <Card className={cn("w-96 shadow-lg border-l-4", getBorderColor())}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-full", getIconColor())}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {notification.title}
                </h4>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-white text-xs",
                    notification.priority === 'high' ? 'bg-red-500' :
                    notification.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  )}
                >
                  {notification.priority.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {notification.message}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notification.actionUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAction}
                      className="text-xs"
                    >
                      {notification.actionText || 'View'}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Toast container component
export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; notification: Notification }>>([]);

  // Function to add new toast (can be called from anywhere in the app)
  const addToast = (notification: Notification) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, notification }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleToastAction = (notification: Notification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Expose addToast function globally
  useEffect(() => {
    (window as any).showNotification = addToast;
    return () => {
      delete (window as any).showNotification;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(({ id, notification }) => (
        <NotificationToast
          key={id}
          notification={notification}
          onDismiss={() => removeToast(id)}
          onAction={() => handleToastAction(notification)}
        />
      ))}
    </div>
  );
}