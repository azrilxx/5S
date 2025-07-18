import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertBuildingSchema, insertFloorSchema, insertZoneSchema, insertAuditSchema, insertChecklistItemSchema, insertActionSchema, insertScheduleSchema, insertReportSchema, insertTeamSchema, insertTagSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractQuestionsFromText } from "./deepseek";
// import { DashboardCache, AuditCache, ActionCache, cache } from "./cache";
// import { wsManager } from "./websocket";

const JWT_SECRET = process.env.JWT_SECRET || "karisma-5s-secret-key";

// File upload configuration for images
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// PDF upload configuration
const pdfUpload = multer({
  dest: 'uploads/pdf/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for PDFs
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  }
});

// Import proper authentication middleware
import { authenticateToken } from "./middleware/auth.js";
import { getRoleByName } from "@shared/constants";

// Notification generation function
async function generateNotificationsForUser(username: string, userRole: string) {
  const notifications = [];
  
  try {
    // Get user's actions
    const userActions = await storage.getActionsByAssignee(username);
    const overdueActions = userActions.filter(action => {
      if (!action.dueDate) return false;
      return new Date(action.dueDate) < new Date() && action.status !== 'closed';
    });
    
    // Generate overdue action notifications
    overdueActions.forEach(action => {
      notifications.push({
        id: `action-overdue-${action.id}`,
        type: 'action_overdue',
        title: 'Action Item Overdue',
        message: `Action "${action.title}" is overdue. Please complete it as soon as possible.`,
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false,
        priority: 'high',
        actionUrl: '/actions',
        actionText: 'View Actions'
      });
    });
    
    // Get user's assigned audits
    const userAudits = await storage.getAuditsByAuditor(username);
    const todayAudits = userAudits.filter(audit => {
      if (!audit.scheduledDate) return false;
      const auditDate = new Date(audit.scheduledDate).toDateString();
      const today = new Date().toDateString();
      return auditDate === today && audit.status === 'scheduled';
    });
    
    // Generate audit notifications
    todayAudits.forEach(audit => {
      notifications.push({
        id: `audit-today-${audit.id}`,
        type: 'audit_assigned',
        title: 'Audit Scheduled Today',
        message: `You have an audit scheduled for ${audit.zone} today. Please ensure you're prepared.`,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isRead: false,
        priority: 'medium',
        actionUrl: '/audits',
        actionText: 'View Audits'
      });
    });
    
    // Generate sample system notifications
    if (userRole === 'admin') {
      notifications.push({
        id: 'system-update-1',
        type: 'system_update',
        title: 'System Update Available',
        message: 'A new system update is available. Please review and apply when convenient.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        priority: 'low',
        actionUrl: '/user-management',
        actionText: 'View System'
      });
    }
    
    // Add a welcome notification for new users
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome-1',
        type: 'system_update',
        title: 'Welcome to Karisma 5S Audit System',
        message: 'Welcome! You can now receive real-time notifications about your audits and actions.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        isRead: false,
        priority: 'low'
      });
    }
    
    return notifications;
  } catch (error) {
    console.error('Error generating notifications:', error);
    return [];
  }
}

export async function registerLegacyRoutes(app: Express): Promise<void> {
  // Note: Authentication routes moved to /server/routes/authRoutes.ts

  // User routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can create users
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userData = {
        ...req.body,
        password: await bcrypt.hash('karisma123', 10) // Default password
      };
      
      const user = await storage.createUser(userData);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile (must come before /api/users/:id route to avoid conflict)
  app.get("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user profile data
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile (must come before /api/users/:id route to avoid conflict)
  app.put("/api/users/profile", authenticateToken, async (req: any, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      
      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { name, email });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = updatedUser;
      res.json(userProfile);
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user settings (must come before /api/users/:id route to avoid conflict)
  app.put("/api/users/settings", authenticateToken, async (req: any, res) => {
    try {
      const { language, notifications, theme } = req.body;
      
      // Validate required fields with safe defaults
      const safeSettings = {
        language: language || 'en',
        notifications: {
          assignedActions: notifications?.assignedActions ?? true,
          upcomingAudits: notifications?.upcomingAudits ?? true,
          overdueItems: notifications?.overdueItems ?? true
        },
        theme: theme || 'light'
      };
      
      // Update user with both language and preferences
      const updatedUser = await storage.updateUser(req.user.id, {
        language: safeSettings.language,
        preferences: safeSettings
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true, settings: safeSettings });
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/status", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update user status
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      const user = await storage.updateUser(id, { isActive });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users/:id/reset-password", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can reset passwords
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const hashedPassword = await bcrypt.hash('karisma123', 10);
      const user = await storage.updateUser(id, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Apply static role assignment (overrides database role)
      const role = getRoleByName(user.name);
      
      // Debug logging for role verification
      console.log(`[DEBUG] User ${user.username} has database role: ${user.role}, static role: ${role}`);
      
      // Return user data in the correct format
      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: role,
        team: user.team,
        zones: user.zones || []
      };
      
      res.json({ success: true, data: userData });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });


  // Get user settings
  app.get("/api/users/settings", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Ensure safe defaults for user settings
      const defaultSettings = {
        language: 'en',
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: 'light'
      };
      
      // Merge user preferences with defaults
      const userPrefs = (user.preferences as any) || {};
      const settings = {
        language: user.language || userPrefs.language || defaultSettings.language,
        notifications: {
          assignedActions: userPrefs.notifications?.assignedActions ?? defaultSettings.notifications.assignedActions,
          upcomingAudits: userPrefs.notifications?.upcomingAudits ?? defaultSettings.notifications.upcomingAudits,
          overdueItems: userPrefs.notifications?.overdueItems ?? defaultSettings.notifications.overdueItems
        },
        theme: userPrefs.theme || defaultSettings.theme
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Get user settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Update user role (admin only)
  app.put("/api/users/:id/role", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update user roles
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const { role } = req.body;
      
      if (!role || !['admin', 'supervisor', 'auditor', 'user'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Don't allow changing own role
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }
      
      const updatedUser = await storage.updateUser(id, { role });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit logs route
  app.get("/api/audit-logs", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can view audit logs
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { getAuditLogs } = await import("./middleware/auditLogger");
      const logs = getAuditLogs(1000); // Get last 1000 entries
      res.json(logs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Building routes
  app.get("/api/buildings", authenticateToken, async (req, res) => {
    try {
      const buildings = await storage.getAllBuildings();
      res.json(buildings);
    } catch (error) {
      console.error("Get buildings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/buildings", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can create buildings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const building = await storage.createBuilding(req.body);
      res.status(201).json(building);
    } catch (error) {
      console.error("Create building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/buildings/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update buildings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const building = await storage.updateBuilding(id, req.body);
      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }
      res.json(building);
    } catch (error) {
      console.error("Update building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/buildings/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete buildings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteBuilding(id);
      if (!success) {
        return res.status(404).json({ message: "Building not found" });
      }
      res.json({ message: "Building deleted successfully" });
    } catch (error) {
      console.error("Delete building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Floor routes
  app.get("/api/floors", authenticateToken, async (req, res) => {
    try {
      const floors = await storage.getAllFloors();
      res.json(floors);
    } catch (error) {
      console.error("Get floors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/floors/building/:buildingId", authenticateToken, async (req, res) => {
    try {
      const buildingId = parseInt(req.params.buildingId);
      const floors = await storage.getFloorsByBuilding(buildingId);
      res.json(floors);
    } catch (error) {
      console.error("Get floors by building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/floors", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can create floors
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const floor = await storage.createFloor(req.body);
      res.status(201).json(floor);
    } catch (error) {
      console.error("Create floor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/floors/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update floors
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const floor = await storage.updateFloor(id, req.body);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json(floor);
    } catch (error) {
      console.error("Update floor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/floors/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete floors
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteFloor(id);
      if (!success) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json({ message: "Floor deleted successfully" });
    } catch (error) {
      console.error("Delete floor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Zone routes
  app.get("/api/zones", authenticateToken, async (req, res) => {
    try {
      const zones = await storage.getAllZones();
      res.json(zones);
    } catch (error) {
      console.error("Get zones error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/zones/building/:buildingId", authenticateToken, async (req, res) => {
    try {
      const buildingId = parseInt(req.params.buildingId);
      const zones = await storage.getZonesByBuilding(buildingId);
      res.json(zones);
    } catch (error) {
      console.error("Get zones by building error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/zones/floor/:floorId", authenticateToken, async (req, res) => {
    try {
      const floorId = parseInt(req.params.floorId);
      const zones = await storage.getZonesByFloor(floorId);
      res.json(zones);
    } catch (error) {
      console.error("Get zones by floor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/zones", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can create zones
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const zone = await storage.createZone(req.body);
      res.status(201).json(zone);
    } catch (error) {
      console.error("Create zone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/zones/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update zones
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const zone = await storage.updateZone(id, req.body);
      if (!zone) {
        return res.status(404).json({ message: "Zone not found" });
      }
      res.json(zone);
    } catch (error) {
      console.error("Update zone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/zones/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete zones
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteZone(id);
      if (!success) {
        return res.status(404).json({ message: "Zone not found" });
      }
      res.json({ message: "Zone deleted successfully" });
    } catch (error) {
      console.error("Delete zone error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Team routes
  app.get("/api/teams", authenticateToken, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/teams/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Get team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notification Rules routes
  app.get("/api/notification-rules", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can manage notification rules
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const rules = await storage.getAllNotificationRules();
      res.json(rules);
    } catch (error) {
      console.error("Get notification rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notification-rules", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can create notification rules
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const rule = await storage.createNotificationRule(req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Create notification rule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/notification-rules/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can update notification rules
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const rule = await storage.updateNotificationRule(id, req.body);
      if (!rule) {
        return res.status(404).json({ message: "Notification rule not found" });
      }
      res.json(rule);
    } catch (error) {
      console.error("Update notification rule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/notification-rules/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can delete notification rules
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotificationRule(id);
      if (!success) {
        return res.status(404).json({ message: "Notification rule not found" });
      }
      res.json({ message: "Notification rule deleted successfully" });
    } catch (error) {
      console.error("Delete notification rule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manual notification trigger for testing
  app.post("/api/notification-rules/trigger", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can trigger notifications
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { notificationService } = await import("./notificationService.js");
      await notificationService.runPeriodicChecks();
      res.json({ message: "Notification checks triggered successfully" });
    } catch (error) {
      console.error("Trigger notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/teams/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update teams
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const team = await storage.updateTeam(id, req.body);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/teams/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete teams
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeam(id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      // Only admin/superadmin can create teams
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const teamData = req.body;
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/teams/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update teams
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const id = parseInt(req.params.id);
      const updates = req.body;
      const team = await storage.updateTeam(id, updates);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/teams/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete teams
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeam(id);
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit routes
  app.get("/api/audits", authenticateToken, async (req, res) => {
    try {
      const audits = await storage.getAllAudits();
      res.json(audits);
    } catch (error) {
      console.error("Get audits error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audits/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getAudit(id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Get audit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/audits", authenticateToken, async (req: any, res) => {
    try {
      // Parse the request body and add auditor from authenticated user
      const requestData = { ...req.body, auditor: req.user.username };
      
      // Convert scheduledDate string to Date object if provided
      if (requestData.scheduledDate) {
        requestData.scheduledDate = new Date(requestData.scheduledDate);
      }
      
      // Convert completedAt string to Date object if provided
      if (requestData.completedAt) {
        requestData.completedAt = new Date(requestData.completedAt);
      }
      
      // Extract answers from the request for checklist items
      const answers = requestData.answers || [];
      delete requestData.answers; // Remove answers from audit data
      
      const auditData = insertAuditSchema.parse(requestData);
      const audit = await storage.createAudit(auditData);
      
      // Create checklist items if answers are provided
      if (answers.length > 0) {
        for (const answer of answers) {
          const checklistItemData = {
            auditId: audit.id,
            category: answer.category,
            question: answer.question,
            response: answer.response,
            comments: answer.note || null,
            photoUrl: answer.photo || null,
            requiresAction: answer.response === '✗',
            order: 0
          };
          
          await storage.createChecklistItem(checklistItemData);
        }
      }
      
      res.status(201).json(audit);
    } catch (error) {
      console.error("Create audit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/audits/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = { ...req.body };
      
      // Convert date fields to Date objects if they exist
      if (updates.scheduledDate && typeof updates.scheduledDate === 'string') {
        updates.scheduledDate = new Date(updates.scheduledDate);
      }
      if (updates.startedAt && typeof updates.startedAt === 'string') {
        updates.startedAt = new Date(updates.startedAt);
      }
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      
      const audit = await storage.updateAudit(id, updates);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Update audit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/audits/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAudit(id);
      if (!success) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json({ message: "Audit deleted successfully" });
    } catch (error) {
      console.error("Delete audit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Checklist item routes
  app.get("/api/audits/:auditId/checklist-items", authenticateToken, async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.getChecklistItemsByAudit(auditId);
      res.json(items);
    } catch (error) {
      console.error("Get checklist items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checklist-items", authenticateToken, async (req, res) => {
    try {
      const itemData = insertChecklistItemSchema.parse(req.body);
      const item = await storage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create checklist item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/checklist-items/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateChecklistItem(id, updates);
      if (!item) {
        return res.status(404).json({ message: "Checklist item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Update checklist item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Action routes
  app.get("/api/actions", authenticateToken, async (req: any, res) => {
    try {
      const { assignee, zone } = req.query;
      let actions;
      
      if (assignee) {
        actions = await storage.getActionsByAssignee(assignee);
      } else if (zone) {
        actions = await storage.getActionsByZone(zone);
      } else {
        actions = await storage.getAllActions();
      }
      
      res.json(actions);
    } catch (error) {
      console.error("Get actions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/actions", authenticateToken, async (req: any, res) => {
    try {
      const actionData = insertActionSchema.parse(req.body);
      const action = await storage.createAction({
        ...actionData,
        assignedBy: req.user.username
      });
      
      // // Invalidate relevant caches
      // ActionCache.invalidateForAssignee(action.assignedTo);
      // ActionCache.invalidateForZone(action.zone);
      // DashboardCache.invalidate();
      
      // // Send real-time notification
      // if (wsManager) {
      //   wsManager.notifyActionCreated(action.assignedTo, action);
      // }
      
      res.status(201).json(action);
    } catch (error) {
      console.error("Create action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/actions/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const action = await storage.updateAction(id, updates);
      if (!action) {
        return res.status(404).json({ message: "Action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Update action error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bulk update actions
  app.put("/api/actions/bulk", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { actionIds, updates } = req.body;
      
      if (!Array.isArray(actionIds) || actionIds.length === 0) {
        return res.status(400).json({ message: "Action IDs are required" });
      }
      
      const updatedActions = [];
      for (const actionId of actionIds) {
        const action = await storage.updateAction(actionId, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
        if (action) {
          updatedActions.push(action);
        }
      }
      
      res.json({ 
        message: `Successfully updated ${updatedActions.length} actions`,
        updatedActions 
      });
    } catch (error) {
      console.error("Bulk update actions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", authenticateToken, async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/schedules", authenticateToken, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Create schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/schedules/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSchedule(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Delete schedule error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Report routes
  app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport({
        ...reportData,
        generatedBy: req.user.username
      });
      res.status(201).json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File upload route
  app.post("/api/upload", authenticateToken, upload.single('file'), async (req: Request & { user?: any; file?: Express.Multer.File }, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ fileUrl });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Message routes
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByRecipient(req.user.username);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/sent", authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesBySender(req.user.username);
      res.json(messages);
    } catch (error) {
      console.error("Get sent messages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/messages/unread-count", authenticateToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadMessagesCount(req.user.username);
      res.json({ count });
    } catch (error) {
      console.error("Get unread messages count error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const { recipient, subject, body } = req.body;
      
      if (!recipient || !body) {
        return res.status(400).json({ message: "Recipient and body are required" });
      }

      const message = await storage.createMessage({
        sender: req.user.username,
        recipient,
        subject: subject || null,
        body,
        isRead: false
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/messages/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/messages/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMessage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Questions CRUD routes
  app.get("/api/questions", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const { zone } = req.query;
      const questions = await storage.getAllQuestions();
      
      // Filter questions by zone if zone parameter is provided
      if (zone && typeof zone === 'string') {
        const filteredQuestions = questions.filter((q: any) => 
          q.enabledZones && q.enabledZones.includes(zone)
        );
        res.json(filteredQuestions);
      } else {
        res.json(questions);
      }
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/questions/:id", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only admin users can access questions
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Get question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/questions", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only admin users can create questions
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/questions/:id", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only admin users can update questions
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const question = await storage.updateQuestion(id, req.body);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Update question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/questions/:id", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only admin users can delete questions
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteQuestion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Delete question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PDF question extraction route
  app.post("/api/questions/extract-pdf", authenticateToken, pdfUpload.single('pdf'), async (req: Request & { user?: any; file?: Express.Multer.File }, res: Response) => {
    try {
      // Only admin users can extract questions from PDFs
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      // Read and parse PDF using dynamic import
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(pdfBuffer);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      if (!pdfData.text || pdfData.text.trim().length === 0) {
        return res.status(400).json({ message: "No text could be extracted from the PDF" });
      }

      // Extract questions using DeepSeek AI
      const questions = await extractQuestionsFromText(pdfData.text);
      
      if (questions.length === 0) {
        return res.status(400).json({ message: "No valid questions could be extracted from the PDF" });
      }

      res.json({ 
        questions,
        extractedText: pdfData.text.substring(0, 1000) + (pdfData.text.length > 1000 ? "..." : ""),
        totalQuestions: questions.length
      });
    } catch (error) {
      console.error("PDF extraction error:", error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("File cleanup error:", cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: "Failed to extract questions from PDF",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Legacy User Settings Routes (for backward compatibility)
  app.get("/api/settings", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only allow non-admin users to access settings
      if (req.user?.role === 'admin') {
        return res.status(403).json({ message: "Settings are for regular users only" });
      }

      const settingsKey = `user:${req.user.username}:settings`;
      const settings = await storage.getSettings(settingsKey);
      
      // Return default settings if none exist
      const defaultSettings = {
        language: "en",
        notifications: {
          assignedActions: true,
          upcomingAudits: true,
          overdueItems: true
        },
        theme: "light"
      };

      return res.json(settings || defaultSettings);
    } catch (error) {
      console.error("Error getting user settings:", error);
      return res.status(500).json({ message: "Failed to get user settings" });
    }
  });

  app.put("/api/settings", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    console.log("=== LEGACY SETTINGS ROUTE ===");
    console.log("req.user:", req.user);
    try {
      // Only allow non-admin users to update settings
      if (req.user?.role === 'admin') {
        console.log("Blocking admin user from using legacy settings route");
        return res.status(403).json({ message: "Settings are for regular users only" });
      }

      const settingsKey = `user:${req.user.username}:settings`;
      const settings = req.body;
      
      // Validate settings structure
      if (!settings.language || !settings.notifications || !settings.theme) {
        return res.status(400).json({ message: "Invalid settings format" });
      }

      await storage.setSettings(settingsKey, settings);
      return res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating user settings:", error);
      return res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Change Password Route
  app.post("/api/auth/change-password", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Old password and new password are required" });
      }

      // Verify old password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUser(req.user.id, { password: hashedNewPassword });
      
      return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      return res.status(500).json({ message: "Failed to change password" });
    }
  });

  // User Audit History Route
  app.get("/api/audits/history", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      // Only allow non-admin users to view their own audit history
      if (req.user?.role === 'admin') {
        return res.status(403).json({ message: "Audit history is for regular users only" });
      }

      const userAudits = await storage.getAuditsByAuditor(req.user.username);
      const completedAudits = userAudits.filter(audit => audit.status === 'completed');
      
      return res.json(completedAudits);
    } catch (error) {
      console.error("Error getting audit history:", error);
      return res.status(500).json({ message: "Failed to get audit history" });
    }
  });

  // Download Audit PDF Route
  app.get("/api/audits/:id/pdf", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const auditId = parseInt(req.params.id);
      const audit = await storage.getAudit(auditId);
      
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      // Only allow users to download their own audits
      if (req.user?.role !== 'admin' && audit.auditor !== req.user.username) {
        return res.status(403).json({ message: "You can only download your own audits" });
      }

      // For now, return a simple text response
      // In a real implementation, you would generate a PDF here
      const pdfContent = `
        Audit Report
        ============
        
        Title: ${audit.title}
        Zone: ${audit.zone}
        Auditor: ${audit.auditor}
        Status: ${audit.status}
        Overall Score: ${audit.overallScore}%
        Completed: ${audit.completedAt}
        
        Notes: ${audit.notes || 'No notes available'}
      `;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="audit-${auditId}.pdf"`);
      res.send(pdfContent);
    } catch (error) {
      console.error("Error downloading audit PDF:", error);
      return res.status(500).json({ message: "Failed to download audit PDF" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const notifications = await generateNotificationsForUser(req.user.username, req.user.role);
      return res.json(notifications);
    } catch (error) {
      console.error("Error getting notifications:", error);
      return res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.post("/api/notifications/mark-read", authenticateToken, async (req: Request & { user?: any }, res: Response) => {
    try {
      const { notificationId } = req.body;
      // In a real implementation, you would update the notification status in the database
      return res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Tag management endpoints
  app.get("/api/tags", authenticateToken, async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tags/active", authenticateToken, async (req, res) => {
    try {
      const tags = await storage.getActiveTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching active tags:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tags/category/:category", authenticateToken, async (req, res) => {
    try {
      const { category } = req.params;
      const tags = await storage.getTagsByCategory(category);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags by category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/tags/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tag = await storage.getTag(id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/tags", authenticateToken, async (req, res) => {
    try {
      const result = insertTagSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: result.error.errors 
        });
      }

      const tag = await storage.createTag(result.data);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/tags/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertTagSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: result.error.errors 
        });
      }

      const tag = await storage.updateTag(id, result.data);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/tags/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTag(id);
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const audits = await storage.getAllAudits();
      const actions = await storage.getAllActions();
      const teams = await storage.getAllTeams();
      const users = await storage.getAllUsers();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysAudits = audits.filter(audit => {
        if (!audit.scheduledDate) return false;
        const auditDate = new Date(audit.scheduledDate);
        auditDate.setHours(0, 0, 0, 0);
        return auditDate.getTime() === today.getTime();
      }).length;
      
      const pendingActions = actions.filter(action => action.status === 'pending').length;
      const overdueActions = actions.filter(action => 
        action.status === 'pending' && action.dueDate && new Date(action.dueDate) < new Date()
      ).length;
      
      const totalAudits = audits.length;
      const completedAudits = audits.filter(audit => audit.status === 'completed').length;
      const complianceRate = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;
      const activeUsers = users.filter(user => user.isActive).length;
      const totalTeams = teams.length;
      
      const stats = {
        todaysAudits,
        pendingActions,
        overdueActions,
        complianceRate,
        activeUsers,
        totalTeams,
        totalAudits,
        completedAudits,
        lastUpdated: new Date().toISOString()
      };
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



}
