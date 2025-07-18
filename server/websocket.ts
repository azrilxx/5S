import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "karisma-5s-secret-key";

interface AuthenticatedWebSocket extends WebSocket {
  user?: any;
  userId?: string;
  username?: string;
  subscriptions?: string[];
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }) {
    const url = new URL(info.req.url || '', `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return false;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (info.req as any).user = decoded;
      return true;
    } catch (error) {
      return false;
    }
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage) {
    const user = (req as any).user;
    if (!user) {
      ws.close(1008, 'Invalid authentication');
      return;
    }

    ws.user = user;
    ws.username = user.username;
    ws.userId = user.id;

    // Add to user's client list
    const userClients = this.clients.get(user.username) || [];
    userClients.push(ws);
    this.clients.set(user.username, userClients);

    console.log(`WebSocket connected: ${user.username} (${userClients.length} connections)`);

    // Send welcome message
    this.sendToUser(user.username, {
      type: 'connection_established',
      message: 'Real-time connection established',
      timestamp: new Date().toISOString()
    });

    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      this.removeClient(user.username, ws);
      console.log(`WebSocket disconnected: ${user.username}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${user.username}:`, error);
      this.removeClient(user.username, ws);
    });
  }

  private handleClientMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'subscribe':
        // Handle subscription to specific channels (audits, actions, etc.)
        this.handleSubscription(ws, message);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private handleSubscription(ws: AuthenticatedWebSocket, message: any) {
    // Store subscription preferences on the WebSocket
    ws.subscriptions = ws.subscriptions || [];
    if (message.channel && !ws.subscriptions.includes(message.channel)) {
      ws.subscriptions.push(message.channel);
    }
  }

  private removeClient(username: string, ws: AuthenticatedWebSocket) {
    const userClients = this.clients.get(username) || [];
    const index = userClients.indexOf(ws);
    if (index > -1) {
      userClients.splice(index, 1);
      if (userClients.length === 0) {
        this.clients.delete(username);
      } else {
        this.clients.set(username, userClients);
      }
    }
  }

  // Public methods for broadcasting messages
  public sendToUser(username: string, message: any) {
    const userClients = this.clients.get(username) || [];
    const messageString = JSON.stringify(message);
    
    userClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageString);
      }
    });
  }

  public sendToAllUsers(message: any) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach((userClients, username) => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageString);
        }
      });
    });
  }

  public sendToTeam(teamName: string, message: any) {
    // This would require team membership lookup
    // For now, broadcast to all admin users
    this.sendToRole('admin', message);
  }

  public sendToRole(role: string, message: any) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach((userClients, username) => {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN && ws.user?.role === role) {
          ws.send(messageString);
        }
      });
    });
  }

  // Notification methods
  public notifyAuditAssigned(username: string, audit: any) {
    this.sendToUser(username, {
      type: 'audit_assigned',
      title: 'New Audit Assignment',
      message: `You have been assigned to audit "${audit.title}" in ${audit.zone}`,
      data: audit,
      timestamp: new Date().toISOString()
    });
  }

  public notifyActionCreated(username: string, action: any) {
    this.sendToUser(username, {
      type: 'action_created',
      title: 'New Action Item',
      message: `You have been assigned a new action: "${action.title}"`,
      data: action,
      timestamp: new Date().toISOString()
    });
  }

  public notifyAuditCompleted(auditData: any) {
    this.sendToRole('admin', {
      type: 'audit_completed',
      title: 'Audit Completed',
      message: `Audit "${auditData.title}" in ${auditData.zone} has been completed`,
      data: auditData,
      timestamp: new Date().toISOString()
    });
  }

  public notifyActionOverdue(username: string, action: any) {
    this.sendToUser(username, {
      type: 'action_overdue',
      title: 'Action Overdue',
      message: `Action "${action.title}" is overdue. Please complete it immediately.`,
      data: action,
      priority: 'high',
      timestamp: new Date().toISOString()
    });
  }

  public getStats() {
    const stats = {
      totalConnections: Array.from(this.clients.values()).reduce((total, clients) => total + clients.length, 0),
      uniqueUsers: this.clients.size,
      connectedUsers: Array.from(this.clients.keys())
    };
    
    return stats;
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: any) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}