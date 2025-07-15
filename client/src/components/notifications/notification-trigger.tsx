import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users, Calendar, AlertTriangle } from "lucide-react";
import { Notification } from "./notification-system";

interface NotificationTriggerProps {
  onTrigger: (notification: Notification) => void;
}

export function NotificationTrigger({ onTrigger }: NotificationTriggerProps) {
  const triggerNotification = (type: Notification['type']) => {
    const notifications: Record<Notification['type'], Notification> = {
      'audit_assigned': {
        id: Date.now().toString(),
        type: 'audit_assigned',
        title: 'New Audit Assignment',
        message: 'You have been assigned to conduct a 5S audit for Factory Zone 2. Please review the requirements and prepare accordingly.',
        timestamp: new Date(),
        isRead: false,
        priority: 'medium',
        actionUrl: '/audits',
        actionText: 'View Audit'
      },
      'audit_overdue': {
        id: Date.now().toString(),
        type: 'audit_overdue',
        title: 'Audit Overdue',
        message: 'The audit for Factory Zone 1 is now overdue. Please complete it immediately to maintain compliance.',
        timestamp: new Date(),
        isRead: false,
        priority: 'high',
        actionUrl: '/audits',
        actionText: 'Complete Audit'
      },
      'action_assigned': {
        id: Date.now().toString(),
        type: 'action_assigned',
        title: 'Action Item Assigned',
        message: 'A new corrective action has been assigned to you: "Reorganize tool storage in Section A".',
        timestamp: new Date(),
        isRead: false,
        priority: 'medium',
        actionUrl: '/actions',
        actionText: 'View Action'
      },
      'action_overdue': {
        id: Date.now().toString(),
        type: 'action_overdue',
        title: 'Action Overdue',
        message: 'Your action item "Update safety signage" is past its due date. Please complete it as soon as possible.',
        timestamp: new Date(),
        isRead: false,
        priority: 'high',
        actionUrl: '/actions',
        actionText: 'Complete Action'
      },
      'team_update': {
        id: Date.now().toString(),
        type: 'team_update',
        title: 'Team Update',
        message: 'Your team has been assigned to a new zone. Please check your updated responsibilities.',
        timestamp: new Date(),
        isRead: false,
        priority: 'medium',
        actionUrl: '/teams',
        actionText: 'View Team'
      },
      'system_update': {
        id: Date.now().toString(),
        type: 'system_update',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur this Saturday from 2:00 AM to 4:00 AM. Please save your work before then.',
        timestamp: new Date(),
        isRead: false,
        priority: 'low'
      }
    };

    const notification = notifications[type];
    if (notification) {
      onTrigger(notification);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('audit_assigned')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Audit Assigned
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('audit_overdue')}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Audit Overdue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('action_assigned')}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Action Assigned
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('action_overdue')}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Action Overdue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('team_update')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Team Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerNotification('system_update')}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            System Update
          </Button>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Click buttons above to trigger different types of notifications
        </p>
      </CardContent>
    </Card>
  );
}