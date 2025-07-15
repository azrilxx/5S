import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSchema, insertAuditSchema, insertChecklistItemSchema, insertActionSchema, insertScheduleSchema, insertReportSchema, insertTeamSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "karisma-5s-secret-key";

// File upload configuration
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

// Middleware to verify JWT token
const authenticateToken = (req: Request & { user?: any }, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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
      // Only admin can create users
      if (req.user.role !== 'admin') {
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

  // REMOVED: /api/users/me endpoint - redundant with /api/auth/me
  // Use /api/auth/me instead for getting current user profile

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

  app.post("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can create teams
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const team = await storage.createTeam(req.body);
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
      // Only admin can create teams
      if (req.user.role !== 'admin') {
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
      
      const auditData = insertAuditSchema.parse(requestData);
      const audit = await storage.createAudit(auditData);
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
  app.get("/api/actions", authenticateToken, async (req, res) => {
    try {
      const actions = await storage.getAllActions();
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

  // Dashboard statistics
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const audits = await storage.getAllAudits();
      const actions = await storage.getAllActions();
      const zones = await storage.getAllZones();
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const todaysAudits = audits.filter(audit => {
        const auditDate = audit.scheduledDate ? new Date(audit.scheduledDate).toISOString().split('T')[0] : null;
        return auditDate === todayStr;
      });
      
      const pendingActions = actions.filter(action => action.status === 'open' || action.status === 'in_progress');
      const overdueActions = actions.filter(action => {
        if (!action.dueDate) return false;
        return new Date(action.dueDate) < today && action.status !== 'closed';
      });
      
      const completedAudits = audits.filter(audit => audit.status === 'completed');
      const totalAudits = audits.length;
      const complianceRate = totalAudits > 0 ? Math.round((completedAudits.length / totalAudits) * 100) : 0;
      
      res.json({
        todaysAudits: todaysAudits.length,
        pendingActions: pendingActions.length,
        overdueActions: overdueActions.length,
        complianceRate,
        activeZones: zones.filter(zone => zone.isActive).length,
        recentAudits: audits.slice(-5).reverse(),
        recentActions: actions.slice(-5).reverse()
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

}
