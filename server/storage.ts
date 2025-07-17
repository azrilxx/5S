import { 
  users, buildings, floors, zones, teams, audits, checklistItems, actions, schedules, reports, questions, notificationRules, messages, tags,
  type User, type InsertUser, type Building, type InsertBuilding, type Floor, type InsertFloor,
  type Zone, type InsertZone, type Team, type InsertTeam,
  type Audit, type InsertAudit, type ChecklistItem, type InsertChecklistItem,
  type Action, type InsertAction, type Schedule, type InsertSchedule,
  type Report, type InsertReport, type Question, type InsertQuestion,
  type NotificationRule, type InsertNotificationRule, type Message, type InsertMessage,
  type Tag, type InsertTag
} from "@shared/schema";
import { validateTeamMember, isAuthorizedUser, AUTHORIZED_TEAM_MEMBERS } from "@shared/constants";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Building methods
  getAllBuildings(): Promise<Building[]>;
  getBuilding(id: number): Promise<Building | undefined>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: number, building: Partial<InsertBuilding>): Promise<Building | undefined>;
  deleteBuilding(id: number): Promise<boolean>;

  // Floor methods
  getAllFloors(): Promise<Floor[]>;
  getFloor(id: number): Promise<Floor | undefined>;
  getFloorsByBuilding(buildingId: number): Promise<Floor[]>;
  createFloor(floor: InsertFloor): Promise<Floor>;
  updateFloor(id: number, floor: Partial<InsertFloor>): Promise<Floor | undefined>;
  deleteFloor(id: number): Promise<boolean>;

  // Zone methods
  getAllZones(): Promise<Zone[]>;
  getZone(id: number): Promise<Zone | undefined>;
  getZonesByFloor(floorId: number): Promise<Zone[]>;
  getZonesByBuilding(buildingId: number): Promise<Zone[]>;
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

  // Tag methods
  getAllTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  getActiveTags(): Promise<Tag[]>;
  getTagsByCategory(category: string): Promise<Tag[]>;

  // Settings methods
  getSettings(key: string): Promise<any>;
  setSettings(key: string, settings: any): Promise<void>;
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
  private tags: Map<number, Tag> = new Map();
  
  private currentUserIds = 1;
  private currentZoneIds = 1;
  private currentTeamIds = 1;
  private currentAuditIds = 1;
  private currentChecklistItemIds = 1;
  private currentActionIds = 1;
  private currentScheduleIds = 1;
  private currentReportIds = 1;
  private currentTagIds = 1;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Initialize default admin user
    const adminUser: User = {
      id: this.currentUserIds++,
      username: "admin",
      password: "$2b$10$VOziMDOYDzq9lm0ZP2Nk/uqohQiY.OaAA2sRjZK/Ii4iWxgihszjK", // password: admin123
      name: "System Administrator",
      email: "admin@karisma.com",
      role: "admin",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize test users with proper structure
    const azrilUser: User = {
      id: this.currentUserIds++,
      username: "azril",
      password: "$2b$10$sr0eczlEWk9EIto1r/wMw.hrOOZ.zZTHVB6Ac1d0kqssWjIpuZ.ky", // password: karisma123
      name: "Azril Rahman",
      email: "azril@karisma.com",
      role: "admin",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };

    const lynUser: User = {
      id: this.currentUserIds++,
      username: "lyn",
      password: "$2b$10$sr0eczlEWk9EIto1r/wMw.hrOOZ.zZTHVB6Ac1d0kqssWjIpuZ.ky", // password: karisma123
      name: "Lyn Wong",
      email: "lyn@karisma.com",
      role: "auditor",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };

    const calvinUser: User = {
      id: this.currentUserIds++,
      username: "calvin",
      password: "$2b$10$sr0eczlEWk9EIto1r/wMw.hrOOZ.zZTHVB6Ac1d0kqssWjIpuZ.ky", // password: karisma123
      name: "Calvin Tan",
      email: "calvin@karisma.com",
      role: "auditor",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };

    const shukriUser: User = {
      id: this.currentUserIds++,
      username: "shukri",
      password: "$2b$10$sr0eczlEWk9EIto1r/wMw.hrOOZ.zZTHVB6Ac1d0kqssWjIpuZ.ky", // password: karisma123
      name: "Shukri Hassan",
      email: "shukri@karisma.com",
      role: "admin",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };

    const mayUser: User = {
      id: this.currentUserIds++,
      username: "may",
      password: "$2b$10$sr0eczlEWk9EIto1r/wMw.hrOOZ.zZTHVB6Ac1d0kqssWjIpuZ.ky", // password: karisma123
      name: "May Lim",
      email: "may@karisma.com",
      role: "admin",
      team: null,
      zones: [],
      language: "en",
      preferences: {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(azrilUser.id, azrilUser);
    this.users.set(lynUser.id, lynUser);
    this.users.set(calvinUser.id, calvinUser);
    this.users.set(shukriUser.id, shukriUser);
    this.users.set(mayUser.id, mayUser);

    // Initialize zones
    const defaultZones: Zone[] = [
      { id: this.currentZoneIds++, name: "Office Ground Floor", description: "Reception, Meeting Room, Surau", type: "office", buildingId: 1, floorId: 1, isActive: true, createdAt: new Date() },
      { id: this.currentZoneIds++, name: "Factory Zone 1", description: "Main production area", type: "factory", buildingId: 1, floorId: 1, isActive: true, createdAt: new Date() },
      { id: this.currentZoneIds++, name: "Factory Zone 2", description: "Secondary production area", type: "factory", buildingId: 1, floorId: 1, isActive: true, createdAt: new Date() },
      { id: this.currentZoneIds++, name: "First Floor", description: "Sales 1, Sales 2, Pantry, Meeting Room", type: "office", buildingId: 1, floorId: 2, isActive: true, createdAt: new Date() },
      { id: this.currentZoneIds++, name: "Second Floor", description: "Admin, Filing Room, Accounts", type: "office", buildingId: 1, floorId: 3, isActive: true, createdAt: new Date() },
    ];
    defaultZones.forEach(zone => this.zones.set(zone.id, zone));

    // Initialize teams with proper authorized structure
    const defaultTeams: Team[] = [
      { id: this.currentTeamIds++, name: "Galvanize", leader: "Azril", members: ["Azril", "Afiq", "Joanne"], assignedZones: ["Factory Zone 1", "Main Door", "Receptionist"], responsibilities: ["Daily cleanup", "Equipment maintenance", "Sort and organize workstations"] },
      { id: this.currentTeamIds++, name: "Chrome", leader: "Calvin", members: ["Calvin", "Jenn", "Jennifer", "Aemey"], assignedZones: ["Factory Zone 2", "Meeting Room (Ground Floor)", "Shoes Area"], responsibilities: ["Quality control", "Shine and cleaning", "Standardize procedures"] },
      { id: this.currentTeamIds++, name: "Steel", leader: "Maz", members: ["Maz", "Suzi", "Poh_Chin", "Candy"], assignedZones: ["Common Area (Second Floor)", "Account", "Filing Room"], responsibilities: ["Sustain 5S practices", "Weekly audits", "Training coordination"] },
    ];
    defaultTeams.forEach(team => this.teams.set(team.id, team));

    // Initialize tags
    const defaultTags: Tag[] = [
      { id: this.currentTagIds++, name: "Safety Risk", description: "Issues that pose safety hazards", color: "#ef4444", category: "safety", isActive: true, createdAt: new Date() },
      { id: this.currentTagIds++, name: "Missing Label", description: "Items or areas without proper labeling", color: "#f97316", category: "organization", isActive: true, createdAt: new Date() },
      { id: this.currentTagIds++, name: "Blocked Access", description: "Pathways or equipment with obstructed access", color: "#eab308", category: "accessibility", isActive: true, createdAt: new Date() },
      { id: this.currentTagIds++, name: "Equipment Issue", description: "Machinery or equipment malfunction", color: "#8b5cf6", category: "maintenance", isActive: true, createdAt: new Date() },
      { id: this.currentTagIds++, name: "Cleanliness", description: "Areas requiring cleaning or maintenance", color: "#06b6d4", category: "cleanliness", isActive: true, createdAt: new Date() },
      { id: this.currentTagIds++, name: "Documentation", description: "Missing or outdated documentation", color: "#10b981", category: "quality", isActive: true, createdAt: new Date() },
    ];
    defaultTags.forEach(tag => this.tags.set(tag.id, tag));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Validate user name against authorized list
    const validation = validateTeamMember(insertUser.name);
    if (!validation.isValid) {
      throw new Error(`User creation failed: ${validation.error}`);
    }
    
    const user: User = {
      ...insertUser,
      id: this.currentUserIds++,
      role: insertUser.role ?? "auditor",
      team: insertUser.team ?? null,
      zones: insertUser.zones ?? null,
      language: insertUser.language ?? "en",
      preferences: insertUser.preferences ?? {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      },
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

  // Building methods (placeholder - not implemented in MemStorage)
  async getAllBuildings(): Promise<Building[]> {
    return [];
  }

  async getBuilding(id: number): Promise<Building | undefined> {
    return undefined;
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    throw new Error("Buildings not implemented in MemStorage");
  }

  async updateBuilding(id: number, updates: Partial<InsertBuilding>): Promise<Building | undefined> {
    return undefined;
  }

  async deleteBuilding(id: number): Promise<boolean> {
    return false;
  }

  // Floor methods (placeholder - not implemented in MemStorage)
  async getAllFloors(): Promise<Floor[]> {
    return [];
  }

  async getFloor(id: number): Promise<Floor | undefined> {
    return undefined;
  }

  async getFloorsByBuilding(buildingId: number): Promise<Floor[]> {
    return [];
  }

  async createFloor(insertFloor: InsertFloor): Promise<Floor> {
    throw new Error("Floors not implemented in MemStorage");
  }

  async updateFloor(id: number, updates: Partial<InsertFloor>): Promise<Floor | undefined> {
    return undefined;
  }

  async deleteFloor(id: number): Promise<boolean> {
    return false;
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
      floorId: insertZone.floorId ?? null,
      isActive: insertZone.isActive ?? true,
      createdAt: new Date(),
    };
    this.zones.set(zone.id, zone);
    return zone;
  }

  async updateZone(id: number, updates: Partial<InsertZone>): Promise<Zone | undefined> {
    const zone = this.zones.get(id);
    if (!zone) return undefined;
    
    const updatedZone = { ...zone, ...updates };
    this.zones.set(id, updatedZone);
    return updatedZone;
  }

  async deleteZone(id: number): Promise<boolean> {
    return this.zones.delete(id);
  }

  async getZonesByFloor(floorId: number): Promise<Zone[]> {
    return Array.from(this.zones.values()).filter(zone => zone.floorId === floorId);
  }

  async getZonesByBuilding(buildingId: number): Promise<Zone[]> {
    return Array.from(this.zones.values()).filter(zone => zone.buildingId === buildingId);
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    // Validate team leader
    if (insertTeam.leader && !isAuthorizedUser(insertTeam.leader)) {
      throw new Error(`Team leader "${insertTeam.leader}" is not authorized. Only authorized team members can be leaders.`);
    }
    
    // Validate team members
    if (insertTeam.members) {
      for (const member of insertTeam.members) {
        const validation = validateTeamMember(member);
        if (!validation.isValid) {
          throw new Error(`Team member validation failed: ${validation.error}`);
        }
      }
    }
    
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

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    // Validate team leader if being updated
    if (updates.leader && !isAuthorizedUser(updates.leader)) {
      throw new Error(`Team leader "${updates.leader}" is not authorized. Only authorized team members can be leaders.`);
    }
    
    // Validate team members if being updated
    if (updates.members) {
      for (const member of updates.members) {
        const validation = validateTeamMember(member);
        if (!validation.isValid) {
          throw new Error(`Team member validation failed: ${validation.error}`);
        }
      }
    }
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Audit methods
  async getAllAudits(): Promise<Audit[]> {
    return Array.from(this.audits.values());
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    return this.audits.get(id);
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    // Validate auditor
    if (insertAudit.auditor && !isAuthorizedUser(insertAudit.auditor)) {
      throw new Error(`Audit cannot be assigned to "${insertAudit.auditor}". Only authorized team members can conduct audits.`);
    }
    
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
      tags: insertItem.tags ?? [],
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
    // Validate assigned user
    if (insertAction.assignedTo && !isAuthorizedUser(insertAction.assignedTo)) {
      throw new Error(`Action cannot be assigned to "${insertAction.assignedTo}". Only authorized team members can be assigned actions.`);
    }
    
    // Validate assigned by user
    if (insertAction.assignedBy && !isAuthorizedUser(insertAction.assignedBy)) {
      throw new Error(`Action cannot be assigned by "${insertAction.assignedBy}". Only authorized team members can assign actions.`);
    }
    
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
      tags: insertAction.tags ?? [],
      createdAt: new Date(),
    };
    this.actions.set(action.id, action);
    return action;
  }

  async updateAction(id: number, updates: Partial<InsertAction>): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    // Validate assigned user if being updated
    if (updates.assignedTo && !isAuthorizedUser(updates.assignedTo)) {
      throw new Error(`Action cannot be assigned to "${updates.assignedTo}". Only authorized team members can be assigned actions.`);
    }
    
    // Validate assigned by user if being updated
    if (updates.assignedBy && !isAuthorizedUser(updates.assignedBy)) {
      throw new Error(`Action cannot be assigned by "${updates.assignedBy}". Only authorized team members can assign actions.`);
    }
    
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

  // Question methods (placeholder - not implemented in MemStorage)
  async getAllQuestions(): Promise<Question[]> {
    return [];
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    throw new Error("Questions not implemented in MemStorage");
  }

  async updateQuestion(id: number, updates: Partial<InsertQuestion>): Promise<Question | undefined> {
    return undefined;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return false;
  }

  // Notification rule methods (placeholder - not implemented in MemStorage)
  async getAllNotificationRules(): Promise<NotificationRule[]> {
    return [];
  }

  async getNotificationRule(id: number): Promise<NotificationRule | undefined> {
    return undefined;
  }

  async createNotificationRule(insertRule: InsertNotificationRule): Promise<NotificationRule> {
    throw new Error("Notification rules not implemented in MemStorage");
  }

  async updateNotificationRule(id: number, updates: Partial<InsertNotificationRule>): Promise<NotificationRule | undefined> {
    return undefined;
  }

  async deleteNotificationRule(id: number): Promise<boolean> {
    return false;
  }

  // Message methods (placeholder - not implemented in MemStorage)
  async getAllMessages(): Promise<Message[]> {
    return [];
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    throw new Error("Messages not implemented in MemStorage");
  }

  async updateMessage(id: number, updates: Partial<InsertMessage>): Promise<Message | undefined> {
    return undefined;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return false;
  }

  async getMessagesByRecipient(recipient: string): Promise<Message[]> {
    return [];
  }

  async getMessagesBySender(sender: string): Promise<Message[]> {
    return [];
  }

  async getUnreadMessagesCount(recipient: string): Promise<number> {
    return 0;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    return false;
  }

  // Tag methods
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const tag: Tag = {
      ...insertTag,
      id: this.currentTagIds++,
      description: insertTag.description ?? null,
      color: insertTag.color ?? "#3b82f6",
      category: insertTag.category ?? null,
      isActive: insertTag.isActive ?? true,
      createdAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  async updateTag(id: number, updates: Partial<InsertTag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;
    
    const updatedTag = { ...tag, ...updates };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: number): Promise<boolean> {
    return this.tags.delete(id);
  }

  async getActiveTags(): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.isActive);
  }

  async getTagsByCategory(category: string): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.category === category);
  }

  // Settings methods
  private settingsStore: Map<string, any> = new Map();

  async getSettings(key: string): Promise<any> {
    return this.settingsStore.get(key);
  }

  async setSettings(key: string, settings: any): Promise<void> {
    this.settingsStore.set(key, settings);
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Validate user name against authorized list
    const validation = validateTeamMember(insertUser.name);
    if (!validation.isValid) {
      throw new Error(`User creation failed: ${validation.error}`);
    }
    
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

  // Building methods
  async getAllBuildings(): Promise<Building[]> {
    return await db.select().from(buildings);
  }

  async getBuilding(id: number): Promise<Building | undefined> {
    const [building] = await db.select().from(buildings).where(eq(buildings.id, id));
    return building || undefined;
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const [building] = await db.insert(buildings).values(insertBuilding).returning();
    return building;
  }

  async updateBuilding(id: number, updates: Partial<InsertBuilding>): Promise<Building | undefined> {
    const [building] = await db.update(buildings).set(updates).where(eq(buildings.id, id)).returning();
    return building || undefined;
  }

  async deleteBuilding(id: number): Promise<boolean> {
    const result = await db.delete(buildings).where(eq(buildings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Floor methods
  async getAllFloors(): Promise<Floor[]> {
    return await db.select().from(floors);
  }

  async getFloor(id: number): Promise<Floor | undefined> {
    const [floor] = await db.select().from(floors).where(eq(floors.id, id));
    return floor || undefined;
  }

  async getFloorsByBuilding(buildingId: number): Promise<Floor[]> {
    return await db.select().from(floors).where(eq(floors.buildingId, buildingId));
  }

  async createFloor(insertFloor: InsertFloor): Promise<Floor> {
    const [floor] = await db.insert(floors).values(insertFloor).returning();
    return floor;
  }

  async updateFloor(id: number, updates: Partial<InsertFloor>): Promise<Floor | undefined> {
    const [floor] = await db.update(floors).set(updates).where(eq(floors.id, id)).returning();
    return floor || undefined;
  }

  async deleteFloor(id: number): Promise<boolean> {
    const result = await db.delete(floors).where(eq(floors.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Zone methods
  async getAllZones(): Promise<Zone[]> {
    return await db.select().from(zones);
  }

  async getZone(id: number): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone || undefined;
  }

  async getZonesByFloor(floorId: number): Promise<Zone[]> {
    return await db.select().from(zones).where(eq(zones.floorId, floorId));
  }

  async getZonesByBuilding(buildingId: number): Promise<Zone[]> {
    return await db.select().from(zones).where(eq(zones.buildingId, buildingId));
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const [zone] = await db
      .insert(zones)
      .values(insertZone)
      .returning();
    return zone;
  }

  async updateZone(id: number, updates: Partial<InsertZone>): Promise<Zone | undefined> {
    const [zone] = await db.update(zones).set(updates).where(eq(zones.id, id)).returning();
    return zone || undefined;
  }

  async deleteZone(id: number): Promise<boolean> {
    const result = await db.delete(zones).where(eq(zones.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    // Validate team leader
    if (insertTeam.leader && !isAuthorizedUser(insertTeam.leader)) {
      throw new Error(`Team leader "${insertTeam.leader}" is not authorized. Only authorized team members can be leaders.`);
    }
    
    // Validate team members
    if (insertTeam.members) {
      for (const member of insertTeam.members) {
        const validation = validateTeamMember(member);
        if (!validation.isValid) {
          throw new Error(`Team member validation failed: ${validation.error}`);
        }
      }
    }
    
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    return team;
  }

  async updateTeam(id: number, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    // Validate team leader if being updated
    if (updates.leader && !isAuthorizedUser(updates.leader)) {
      throw new Error(`Team leader "${updates.leader}" is not authorized. Only authorized team members can be leaders.`);
    }
    
    // Validate team members if being updated
    if (updates.members) {
      for (const member of updates.members) {
        const validation = validateTeamMember(member);
        if (!validation.isValid) {
          throw new Error(`Team member validation failed: ${validation.error}`);
        }
      }
    }
    
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
    // Validate auditor
    if (insertAudit.auditor && !isAuthorizedUser(insertAudit.auditor)) {
      throw new Error(`Audit cannot be assigned to "${insertAudit.auditor}". Only authorized team members can conduct audits.`);
    }
    
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
      return result.rowCount !== null && result.rowCount > 0;
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
    // Validate assigned user
    if (insertAction.assignedTo && !isAuthorizedUser(insertAction.assignedTo)) {
      throw new Error(`Action cannot be assigned to "${insertAction.assignedTo}". Only authorized team members can be assigned actions.`);
    }
    
    // Validate assigned by user
    if (insertAction.assignedBy && !isAuthorizedUser(insertAction.assignedBy)) {
      throw new Error(`Action cannot be assigned by "${insertAction.assignedBy}". Only authorized team members can assign actions.`);
    }
    
    const [action] = await db
      .insert(actions)
      .values(insertAction)
      .returning();
    return action;
  }

  async updateAction(id: number, updates: Partial<InsertAction>): Promise<Action | undefined> {
    // Validate assigned user if being updated
    if (updates.assignedTo && !isAuthorizedUser(updates.assignedTo)) {
      throw new Error(`Action cannot be assigned to "${updates.assignedTo}". Only authorized team members can be assigned actions.`);
    }
    
    // Validate assigned by user if being updated
    if (updates.assignedBy && !isAuthorizedUser(updates.assignedBy)) {
      throw new Error(`Action cannot be assigned by "${updates.assignedBy}". Only authorized team members can assign actions.`);
    }
    
    const [action] = await db
      .update(actions)
      .set(updates)
      .where(eq(actions.id, id))
      .returning();
    return action || undefined;
  }

  async getActionsByAssignee(assignee: string): Promise<Action[]> {
    return await db.select().from(actions).where(eq(actions.assignedTo, assignee));
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
    return await db.select().from(schedules).where(eq(schedules.isActive, true));
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



  // Message methods
  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Validate sender
    if (insertMessage.sender && !isAuthorizedUser(insertMessage.sender)) {
      throw new Error(`Message cannot be sent by "${insertMessage.sender}". Only authorized team members can send messages.`);
    }
    
    // Validate recipient
    if (insertMessage.recipient && !isAuthorizedUser(insertMessage.recipient)) {
      throw new Error(`Message cannot be sent to "${insertMessage.recipient}". Only authorized team members can receive messages.`);
    }
    
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

  // Tag methods
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }

  async updateTag(id: number, updates: Partial<InsertTag>): Promise<Tag | undefined> {
    const [tag] = await db.update(tags).set(updates).where(eq(tags.id, id)).returning();
    return tag || undefined;
  }

  async deleteTag(id: number): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getActiveTags(): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.isActive, true));
  }

  async getTagsByCategory(category: string): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.category, category));
  }

  // Settings methods - using a simple in-memory store for now
  private settingsStore: Map<string, any> = new Map();

  async getSettings(key: string): Promise<any> {
    return this.settingsStore.get(key);
  }

  async setSettings(key: string, settings: any): Promise<void> {
    this.settingsStore.set(key, settings);
  }
}

export const storage = new MemStorage();
