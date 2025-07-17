import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("auditor"), // admin, auditor, supervisor, viewer
  team: text("team"), // A, B, C, D, E, F, G, H, I
  zones: text("zones").array().default([]), // assigned zones
  language: text("language").default("en"), // en, zh
  preferences: json("preferences").default({}), // user preferences as JSON
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Buildings table
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Floors table
export const floors = pgTable("floors", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zones table (updated with building and floor references)
export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").notNull(),
  floorId: integer("floor_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // office, factory
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Team A, Team B, etc.
  leader: text("leader"),
  members: text("members").array().default([]),
  assignedZones: text("assigned_zones").array().default([]),
  responsibilities: text("responsibilities").array().default([]),
});

// Audits table
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  zone: text("zone").notNull(),
  auditor: text("auditor").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, draft
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  overallScore: integer("overall_score").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist items table
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull(),
  category: text("category").notNull(), // 1S, 2S, 3S, 4S, 5S
  question: text("question").notNull(),
  response: text("response"), // yes, no, na
  comments: text("comments"),
  photoUrl: text("photo_url"),
  requiresAction: boolean("requires_action").default(false),
  order: integer("order").default(0),
  tags: text("tags").array().default([])
});

// Actions table
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  auditId: integer("audit_id"),
  checklistItemId: integer("checklist_item_id"),
  assignedTo: text("assigned_to").notNull(),
  assignedBy: text("assigned_by").notNull(),
  zone: text("zone").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("open"), // open, in_progress, closed
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  proofPhotoUrl: text("proof_photo_url"),
  comments: text("comments"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schedules table
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  zone: text("zone").notNull(),
  assignedTo: text("assigned_to").notNull(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly
  time: text("time").notNull(), // HH:MM format
  duration: integer("duration").default(60), // minutes
  isActive: boolean("is_active").default(true),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  auditId: integer("audit_id"),
  generatedBy: text("generated_by").notNull(),
  type: text("type").notNull(), // audit, compliance, trend
  format: text("format").notNull().default("pdf"), // pdf, csv
  fileUrl: text("file_url"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  question: text("question").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(false).notNull(),
  enabledZones: text("enabled_zones").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification Rules table
export const notificationRules = pgTable("notification_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(),
  conditions: text("conditions").notNull(), // JSON string
  actions: text("actions").notNull(), // JSON string
  recipients: text("recipients").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender: text("sender").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3b82f6"), // hex color code
  category: text("category"), // safety, quality, cleanliness, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBuildingSchema = createInsertSchema(buildings).omit({ id: true, createdAt: true });
export const insertFloorSchema = createInsertSchema(floors).omit({ id: true, createdAt: true });
export const insertZoneSchema = createInsertSchema(zones).omit({ id: true, createdAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true });
export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ id: true });
export const insertActionSchema = createInsertSchema(actions).omit({ id: true, createdAt: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationRuleSchema = createInsertSchema(notificationRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Floor = typeof floors.$inferSelect;
export type InsertFloor = z.infer<typeof insertFloorSchema>;
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type Action = typeof actions.$inferSelect;
export type InsertAction = z.infer<typeof insertActionSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type NotificationRule = typeof notificationRules.$inferSelect;
export type InsertNotificationRule = z.infer<typeof insertNotificationRuleSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
