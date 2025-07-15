import { 
  users, zones, teams, audits, checklistItems, actions, schedules, reports, questions, notificationRules, messages,
  type User, type InsertUser, type Zone, type InsertZone, type Team, type InsertTeam,
  type Audit, type InsertAudit, type ChecklistItem, type InsertChecklistItem,
  type Action, type InsertAction, type Schedule, type InsertSchedule,
  type Report, type InsertReport, type Question, type InsertQuestion,
  type NotificationRule, type InsertNotificationRule, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Zone methods
  getAllZones(): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: number, zone: Partial<InsertZone>): Promise<Zone | undefined>;
  deleteZone(id: number): Promise<boolean>;

  // Team methods
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Audit methods
  getAllAudits(): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined>;
  deleteAudit(id: number): Promise<boolean>;
  getAuditsByZone(zone: string): Promise<Audit[]>;
  getAuditsByAuditor(auditor: string): Promise<Audit[]>;

  // Checklist item methods
  getChecklistItemsByAudit(auditId: number): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, item: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined>;

  // Action methods
  getAllActions(): Promise<Action[]>;
  getAction(id: number): Promise<Action | undefined>;
  createAction(action: InsertAction): Promise<Action>;
  updateAction(id: number, action: Partial<InsertAction>): Promise<Action | undefined>;
  getActionsByAssignee(assignee: string): Promise<Action[]>;
  getActionsByZone(zone: string): Promise<Action[]>;

  // Schedule methods
  getAllSchedules(): Promise<Schedule[]>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  getActiveSchedules(): Promise<Schedule[]>;

  // Report methods
  getAllReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;

  // Question methods
  getAllQuestions(): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Notification rule methods
  getAllNotificationRules(): Promise<NotificationRule[]>;
  getNotificationRule(id: number): Promise<NotificationRule | undefined>;
  createNotificationRule(rule: InsertNotificationRule): Promise<NotificationRule>;
  updateNotificationRule(id: number, rule: Partial<InsertNotificationRule>): Promise<NotificationRule | undefined>;
  deleteNotificationRule(id: number): Promise<boolean>;

  // Message methods
  getAllMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  getMessagesByRecipient(recipient: string): Promise<Message[]>;
  getMessagesBySender(sender: string): Promise<Message[]>;
  getUnreadMessagesCount(recipient: string): Promise<number>;
  markMessageAsRead(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private zones: Map<number, Zone> = new Map();
  private teams: Map<number, Team> = new Map();
  private audits: Map<number, Audit> = new Map();
  private checklistItems: Map<number, ChecklistItem> = new Map();
  private actions: Map<number, Action> = new Map();
  private schedules: Map<number, Schedule> = new Map();
  private reports: Map<number, Report> = new Map();
  
  private currentUserIds = 1;
  private currentZoneIds = 1;
  private currentTeamIds = 1;
  private currentAuditIds = 1;
  private currentChecklistItemIds = 1;
  private currentActionIds = 1;
  private currentScheduleIds = 1;
  private currentReportIds = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize default admin user
    const adminUser: User = {
      id: this.currentUserIds++,
      username: "admin",
      password: "$argon2id$v=19$m=19456,t=2,p=1$713b8Be8s/r8rUZnSFqVqw$8lT8NOLCqmGFlF9fCTrJEpsxJTNq5m1wsqsTJMShjEM", // password: admin123
      name: "System Administrator",
      email: "admin@karisma.com",
      role: "admin",
      team: null,
      zones: [],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize zones
    const defaultZones: Zone[] = [
      { id: this.currentZoneIds++, name: "Office Ground Floor", description: "Reception, Meeting Room, Surau", type: "office", floor: "Ground", isActive: true },
      { id: this.currentZoneIds++, name: "Factory Zone 1", description: "Main production area", type: "factory", floor: "Ground", isActive: true },
      { id: this.currentZoneIds++, name: "Factory Zone 2", description: "Secondary production area", type: "factory", floor: "Ground", isActive: true },
      { id: this.currentZoneIds++, name: "First Floor", description: "Sales 1, Sales 2, Pantry, Meeting Room", type: "office", floor: "First", isActive: true },
      { id: this.currentZoneIds++, name: "Second Floor", description: "Admin, Filing Room, Accounts", type: "office", floor: "Second", isActive: true },
    ];
    defaultZones.forEach(zone => this.zones.set(zone.id, zone));

    // Initialize teams
    const defaultTeams: Team[] = [
      { id: this.currentTeamIds++, name: "Team A", leader: "John Doe", members: ["John Doe", "Jane Smith"], assignedZones: ["Factory Zone 1"], responsibilities: ["1S", "2S"] },
      { id: this.currentTeamIds++, name: "Team B", leader: "Bob Johnson", members: ["Bob Johnson", "Alice Brown"], assignedZones: ["Factory Zone 2"], responsibilities: ["3S", "4S"] },
      { id: this.currentTeamIds++, name: "Team C", leader: "Carol Davis", members: ["Carol Davis", "Mike Wilson"], assignedZones: ["Office Ground Floor"], responsibilities: ["5S", "1S"] },
    ];
    defaultTeams.forEach(team => this.teams.set(team.id, team));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserIds++,
      role: insertUser.role ?? "auditor",
      team: insertUser.team ?? null,
      zones: insertUser.zones ?? null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Zone methods
  async getAllZones(): Promise<Zone[]> {
    return Array.from(this.zones.values());
  }

  async getZone(id: number): Promise<Zone | undefined> {
    return this.zones.get(id);
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const zone: Zone = {
      ...insertZone,
      id: this.currentZoneIds++,
      description: insertZone.description ?? null,
      floor: insertZone.floor ?? null,
      isActive: insertZone.isActive ?? true,
    };
    this.zones.set(zone.id, zone);
    return zone;
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const team: Team = {
      ...insertTeam,
      id: this.currentTeamIds++,
      leader: insertTeam.leader ?? null,
      members: insertTeam.members ?? null,
      assignedZones: insertTeam.assignedZones ?? null,
      responsibilities: insertTeam.responsibilities ?? null,
    };
    this.teams.set(team.id, team);
    return team;
  }

  // Audit methods
  async getAllAudits(): Promise<Audit[]> {
    return Array.from(this.audits.values());
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    return this.audits.get(id);
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    const audit: Audit = {
      ...insertAudit,
      id: this.currentAuditIds++,
      status: insertAudit.status ?? "scheduled",
      scheduledDate: insertAudit.scheduledDate ?? null,
      startedAt: insertAudit.startedAt ?? null,
      completedAt: insertAudit.completedAt ?? null,
      overallScore: insertAudit.overallScore ?? null,
      notes: insertAudit.notes ?? null,
      createdAt: new Date(),
    };
    this.audits.set(audit.id, audit);
    return audit;
  }

  async updateAudit(id: number, updates: Partial<InsertAudit>): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;
    
    const updatedAudit = { ...audit, ...updates };
    this.audits.set(id, updatedAudit);
    return updatedAudit;
  }

  async deleteAudit(id: number): Promise<boolean> {
    const audit = this.audits.get(id);
    if (!audit) return false;
    
    // Delete associated checklist items
    const checklistItems = Array.from(this.checklistItems.values())
      .filter(item => item.auditId === id);
    checklistItems.forEach(item => this.checklistItems.delete(item.id));
    
    // Delete the audit
    this.audits.delete(id);
    return true;
  }

  async getAuditsByZone(zone: string): Promise<Audit[]> {
    return Array.from(this.audits.values()).filter(audit => audit.zone === zone);
  }

  async getAuditsByAuditor(auditor: string): Promise<Audit[]> {
    return Array.from(this.audits.values()).filter(audit => audit.auditor === auditor);
  }

  // Checklist item methods
  async getChecklistItemsByAudit(auditId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values()).filter(item => item.auditId === auditId);
  }

  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const item: ChecklistItem = {
      ...insertItem,
      id: this.currentChecklistItemIds++,
      order: insertItem.order ?? null,
      response: insertItem.response ?? null,
      comments: insertItem.comments ?? null,
      photoUrl: insertItem.photoUrl ?? null,
      requiresAction: insertItem.requiresAction ?? null,
    };
    this.checklistItems.set(item.id, item);
    return item;
  }

  async updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const item = this.checklistItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }

  // Action methods
  async getAllActions(): Promise<Action[]> {
    return Array.from(this.actions.values());
  }

  async getAction(id: number): Promise<Action | undefined> {
    return this.actions.get(id);
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const action: Action = {
      ...insertAction,
      id: this.currentActionIds++,
      status: insertAction.status ?? "open",
      priority: insertAction.priority ?? "medium",
      description: insertAction.description ?? null,
      completedAt: insertAction.completedAt ?? null,
      auditId: insertAction.auditId ?? null,
      checklistItemId: insertAction.checklistItemId ?? null,
      dueDate: insertAction.dueDate ?? null,
      proofPhotoUrl: insertAction.proofPhotoUrl ?? null,
      comments: insertAction.comments ?? null,
      createdAt: new Date(),
    };
    this.actions.set(action.id, action);
    return action;
  }

  async updateAction(id: number, updates: Partial<InsertAction>): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    const updatedAction = { ...action, ...updates };
    this.actions.set(id, updatedAction);
    return updatedAction;
  }

  async getActionsByAssignee(assignee: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.assignedTo === assignee);
  }

  async getActionsByZone(zone: string): Promise<Action[]> {
    return Array.from(this.actions.values()).filter(action => action.zone === zone);
  }

  // Schedule methods
  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const schedule: Schedule = {
      ...insertSchedule,
      id: this.currentScheduleIds++,
      duration: insertSchedule.duration ?? null,
      isActive: insertSchedule.isActive ?? true,
      dayOfWeek: insertSchedule.dayOfWeek ?? null,
      dayOfMonth: insertSchedule.dayOfMonth ?? null,
      nextRun: insertSchedule.nextRun ?? null,
      createdAt: new Date(),
    };
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async getActiveSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => schedule.isActive);
  }

  // Report methods
  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const report: Report = {
      ...insertReport,
      id: this.currentReportIds++,
      metadata: insertReport.metadata ?? {},
      format: insertReport.format ?? "pdf",
      auditId: insertReport.auditId ?? null,
      fileUrl: insertReport.fileUrl ?? null,
      createdAt: new Date(),
    };
    this.reports.set(report.id, report);
    return report;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllZones(): Promise<Zone[]> {
    return await db.select().from(zones);
  }

  async getZone(id: number): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone || undefined;
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const [zone] = await db
      .insert(zones)
      .values(insertZone)
      .returning();
    return zone;
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllAudits(): Promise<Audit[]> {
    return await db.select().from(audits);
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit || undefined;
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    const [audit] = await db
      .insert(audits)
      .values(insertAudit)
      .returning();
    return audit;
  }

  async updateAudit(id: number, updates: Partial<InsertAudit>): Promise<Audit | undefined> {
    const [audit] = await db
      .update(audits)
      .set(updates)
      .where(eq(audits.id, id))
      .returning();
    return audit || undefined;
  }

  async deleteAudit(id: number): Promise<boolean> {
    try {
      // First delete associated checklist items
      await db.delete(checklistItems).where(eq(checklistItems.auditId, id));
      
      // Then delete the audit
      const result = await db.delete(audits).where(eq(audits.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting audit:", error);
      return false;
    }
  }

  async getAuditsByZone(zone: string): Promise<Audit[]> {
    return await db.select().from(audits).where(eq(audits.zone, zone));
  }

  async getAuditsByAuditor(auditor: string): Promise<Audit[]> {
    return await db.select().from(audits).where(eq(audits.auditor, auditor));
  }

  async getChecklistItemsByAudit(auditId: number): Promise<ChecklistItem[]> {
    return await db.select().from(checklistItems).where(eq(checklistItems.auditId, auditId));
  }

  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const [item] = await db
      .insert(checklistItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateChecklistItem(id: number, updates: Partial<InsertChecklistItem>): Promise<ChecklistItem | undefined> {
    const [item] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return item || undefined;
  }

  async getAllActions(): Promise<Action[]> {
    return await db.select().from(actions);
  }

  async getAction(id: number): Promise<Action | undefined> {
    const [action] = await db.select().from(actions).where(eq(actions.id, id));
    return action || undefined;
  }

  async createAction(insertAction: InsertAction): Promise<Action> {
    const [action] = await db
      .insert(actions)
      .values(insertAction)
      .returning();
    return action;
  }

  async updateAction(id: number, updates: Partial<InsertAction>): Promise<Action | undefined> {
    const [action] = await db
      .update(actions)
      .set(updates)
      .where(eq(actions.id, id))
      .returning();
    return action || undefined;
  }

  async getActionsByAssignee(assignee: string): Promise<Action[]> {
    return await db.select().from(actions).where(eq(actions.assignee, assignee));
  }

  async getActionsByZone(zone: string): Promise<Action[]> {
    return await db.select().from(actions).where(eq(actions.zone, zone));
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [schedule] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.id, id))
      .returning();
    return schedule || undefined;
  }

  async getActiveSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).where(eq(schedules.status, 'active'));
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  // Questions methods
  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async updateQuestion(id: number, updates: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions).set({ ...updates, updatedAt: new Date() }).where(eq(questions.id, id)).returning();
    return question || undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const result = await db.delete(questions).where(eq(questions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Notification Rules methods
  async getAllNotificationRules(): Promise<NotificationRule[]> {
    return await db.select().from(notificationRules);
  }

  async getNotificationRule(id: number): Promise<NotificationRule | undefined> {
    const [rule] = await db.select().from(notificationRules).where(eq(notificationRules.id, id));
    return rule || undefined;
  }

  async createNotificationRule(insertRule: InsertNotificationRule): Promise<NotificationRule> {
    const [rule] = await db.insert(notificationRules).values(insertRule).returning();
    return rule;
  }

  async updateNotificationRule(id: number, updates: Partial<InsertNotificationRule>): Promise<NotificationRule | undefined> {
    const [rule] = await db.update(notificationRules).set({ ...updates, updatedAt: new Date() }).where(eq(notificationRules.id, id)).returning();
    return rule || undefined;
  }

  async deleteNotificationRule(id: number): Promise<boolean> {
    const result = await db.delete(notificationRules).where(eq(notificationRules.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Zone methods implementation
  async updateZone(id: number, updates: Partial<InsertZone>): Promise<Zone | undefined> {
    const [zone] = await db.update(zones).set(updates).where(eq(zones.id, id)).returning();
    return zone || undefined;
  }

  async deleteZone(id: number): Promise<boolean> {
    const result = await db.delete(zones).where(eq(zones.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Message methods
  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async updateMessage(id: number, updates: Partial<InsertMessage>): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMessagesByRecipient(recipient: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.recipient, recipient))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesBySender(sender: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.sender, sender))
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessagesCount(recipient: string): Promise<number> {
    const result = await db.select({ count: messages.id }).from(messages)
      .where(and(
        eq(messages.recipient, recipient),
        eq(messages.isRead, false)
      ));
    return result.length;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
