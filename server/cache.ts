import { storage } from "./storage";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new SimpleCache();

// Dashboard statistics cache with optimized queries
export class DashboardCache {
  private static readonly CACHE_KEY = "dashboard_stats";
  private static readonly TTL = 2 * 60 * 1000; // 2 minutes for dashboard stats

  static async getStats(): Promise<any> {
    const cached = cache.get(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Fetch all data in parallel for better performance
    const [audits, actions, users, teams] = await Promise.all([
      storage.getAllAudits(),
      storage.getAllActions(),
      storage.getAllUsers(),
      storage.getAllTeams()
    ]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate statistics
    const todaysAudits = audits.filter(audit => {
      if (!audit.scheduledDate) return false;
      const auditDate = new Date(audit.scheduledDate);
      return auditDate >= today && auditDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;

    const pendingActions = actions.filter(action => action.status === 'open').length;
    
    const overdueActions = actions.filter(action => {
      if (!action.dueDate || action.status === 'closed') return false;
      return new Date(action.dueDate) < now;
    }).length;

    const completedAudits = audits.filter(audit => audit.status === 'completed').length;
    const totalAudits = audits.length;
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
      lastUpdated: now.toISOString()
    };

    cache.set(this.CACHE_KEY, stats, this.TTL);
    return stats;
  }

  static invalidate(): void {
    cache.invalidate(this.CACHE_KEY);
  }
}

// Audit statistics cache
export class AuditCache {
  private static readonly CACHE_PREFIX = "audit_stats";
  private static readonly TTL = 3 * 60 * 1000; // 3 minutes

  static async getAuditsByZone(zone: string): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}_zone_${zone}`;
    const cached = cache.get(cacheKey) as any[];
    if (cached) return cached;

    const audits = await storage.getAuditsByZone(zone);
    cache.set(cacheKey, audits, this.TTL);
    return audits;
  }

  static async getAuditsByAuditor(auditor: string): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}_auditor_${auditor}`;
    const cached = cache.get(cacheKey) as any[];
    if (cached) return cached;

    const audits = await storage.getAuditsByAuditor(auditor);
    cache.set(cacheKey, audits, this.TTL);
    return audits;
  }

  static invalidateForZone(zone: string): void {
    cache.invalidate(`${this.CACHE_PREFIX}_zone_${zone}`);
  }

  static invalidateForAuditor(auditor: string): void {
    cache.invalidate(`${this.CACHE_PREFIX}_auditor_${auditor}`);
  }

  static invalidateAll(): void {
    cache.invalidatePattern(this.CACHE_PREFIX);
  }
}

// Action statistics cache
export class ActionCache {
  private static readonly CACHE_PREFIX = "action_stats";
  private static readonly TTL = 2 * 60 * 1000; // 2 minutes

  static async getActionsByAssignee(assignee: string): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}_assignee_${assignee}`;
    const cached = cache.get(cacheKey) as any[];
    if (cached) return cached;

    const actions = await storage.getActionsByAssignee(assignee);
    cache.set(cacheKey, actions, this.TTL);
    return actions;
  }

  static async getActionsByZone(zone: string): Promise<any[]> {
    const cacheKey = `${this.CACHE_PREFIX}_zone_${zone}`;
    const cached = cache.get(cacheKey) as any[];
    if (cached) return cached;

    const actions = await storage.getActionsByZone(zone);
    cache.set(cacheKey, actions, this.TTL);
    return actions;
  }

  static invalidateForAssignee(assignee: string): void {
    cache.invalidate(`${this.CACHE_PREFIX}_assignee_${assignee}`);
  }

  static invalidateForZone(zone: string): void {
    cache.invalidate(`${this.CACHE_PREFIX}_zone_${zone}`);
  }

  static invalidateAll(): void {
    cache.invalidatePattern(this.CACHE_PREFIX);
  }
}