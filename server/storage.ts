import { 
  users, zones, teams, audits, checklistItems, actions, schedules, reports,
  type User, type InsertUser, type Zone, type InsertZone, type Team, type InsertTeam,
  type Audit, type InsertAudit, type ChecklistItem, type InsertChecklistItem,
  type Action, type InsertAction, type Schedule, type InsertSchedule,
  type Report, type InsertReport
} from "@shared/schema";

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

  // Team methods
  getAllTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;

  // Audit methods
  getAllAudits(): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: number, audit: Partial<InsertAudit>): Promise<Audit | undefined>;
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

export const storage = new MemStorage();
