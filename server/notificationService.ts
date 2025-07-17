import { storage } from "./storage.js";
import { Action, Audit, NotificationRule } from "@shared/schema.js";

export interface NotificationContext {
  type: 'action_overdue' | 'audit_failed' | 'audit_assigned' | 'action_assigned';
  data: any;
  recipients: string[];
}

export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendEmailNotification(recipient: string, subject: string, body: string): Promise<boolean> {
    // Mock email delivery for now - structured for future SMTP config
    console.log(`📧 EMAIL NOTIFICATION:
      To: ${recipient}
      Subject: ${subject}
      Body: ${body}
      Status: Mock delivery successful (configure SMTP for real emails)
    `);
    
    // In future, this would integrate with actual email service:
    // return await this.emailProvider.send({ to: recipient, subject, body });
    return true;
  }

  async processOverdueActions(): Promise<void> {
    const actions = await storage.getAllActions();
    const now = new Date();
    
    const overdueActions = actions.filter(action => 
      action.status !== 'closed' && 
      action.dueDate && 
      new Date(action.dueDate) < now
    );

    for (const action of overdueActions) {
      await this.triggerNotification({
        type: 'action_overdue',
        data: action,
        recipients: [action.assignedTo, action.assignedBy]
      });
    }
  }

  async processFailedAudits(): Promise<void> {
    const audits = await storage.getAllAudits();
    
    const failedAudits = audits.filter(audit => 
      audit.status === 'completed' && 
      audit.overallScore !== null &&
      audit.overallScore < 70 // Consider <70% as failed
    );

    for (const audit of failedAudits) {
      await this.triggerNotification({
        type: 'audit_failed',
        data: audit,
        recipients: [audit.auditor, 'azril', 'calvin', 'shukri'] // Include superadmins
      });
    }
  }

  async triggerNotification(context: NotificationContext): Promise<void> {
    const rules = await storage.getAllNotificationRules();
    const activeRules = rules.filter(rule => rule.isActive);

    for (const rule of activeRules) {
      if (this.matchesRule(rule, context)) {
        await this.executeNotificationRule(rule, context);
      }
    }
  }

  private matchesRule(rule: NotificationRule, context: NotificationContext): boolean {
    try {
      const conditions = JSON.parse(rule.conditions);
      return conditions.triggers.includes(context.type);
    } catch (error) {
      console.error('Error parsing notification rule conditions:', error);
      return false;
    }
  }

  private async executeNotificationRule(rule: NotificationRule, context: NotificationContext): Promise<void> {
    try {
      const actions = JSON.parse(rule.actions);
      
      if (actions.email?.enabled) {
        const subject = this.generateSubject(context);
        const body = this.generateBody(context);
        
        const recipients = rule.recipients.length > 0 
          ? rule.recipients 
          : context.recipients;
        
        for (const recipient of recipients) {
          await this.sendEmailNotification(recipient, subject, body);
        }
      }
    } catch (error) {
      console.error('Error executing notification rule:', error);
    }
  }

  private generateSubject(context: NotificationContext): string {
    switch (context.type) {
      case 'action_overdue':
        return `🚨 Overdue Action: ${context.data.title}`;
      case 'audit_failed':
        return `⚠️ Failed Audit: ${context.data.title}`;
      case 'audit_assigned':
        return `📋 New Audit Assignment: ${context.data.title}`;
      case 'action_assigned':
        return `✅ New Action Assignment: ${context.data.title}`;
      default:
        return '📢 Karisma 5S Notification';
    }
  }

  private generateBody(context: NotificationContext): string {
    switch (context.type) {
      case 'action_overdue':
        return `Action "${context.data.title}" assigned to ${context.data.assignedTo} was due on ${new Date(context.data.dueDate).toLocaleDateString()} and is now overdue. Please take immediate action.`;
      case 'audit_failed':
        return `Audit "${context.data.title}" conducted by ${context.data.auditor} has failed with a score of ${context.data.overallScore}%. Please review and take corrective action.`;
      case 'audit_assigned':
        return `You have been assigned a new audit: "${context.data.title}" for zone ${context.data.zone}. Scheduled for ${new Date(context.data.scheduledDate).toLocaleDateString()}.`;
      case 'action_assigned':
        return `You have been assigned a new action: "${context.data.title}" with priority ${context.data.priority}. Due date: ${new Date(context.data.dueDate).toLocaleDateString()}.`;
      default:
        return 'You have a new notification from Karisma 5S Audit System.';
    }
  }

  // Periodic check for overdue items (called by cron job or scheduled task)
  async runPeriodicChecks(): Promise<void> {
    console.log('🔄 Running periodic notification checks...');
    await this.processOverdueActions();
    await this.processFailedAudits();
  }
}

export const notificationService = NotificationService.getInstance();