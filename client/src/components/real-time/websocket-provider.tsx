import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  title?: string;
  message?: string;
  data?: any;
  timestamp?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: any) => void;
  subscribeToChannel: (channel: string) => void;
  unsubscribeFromChannel: (channel: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const connect = () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    };

    websocket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setWs(null);
      
      // Attempt to reconnect
      if (reconnectAttempts < 5) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    setWs(websocket);
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('WebSocket connection established');
        break;
      case 'audit_assigned':
        toast({
          title: message.title || 'Audit Assigned',
          description: message.message,
          variant: 'default',
        });
        break;
      case 'action_created':
        toast({
          title: message.title || 'New Action',
          description: message.message,
          variant: 'default',
        });
        break;
      case 'action_overdue':
        toast({
          title: message.title || 'Action Overdue',
          description: message.message,
          variant: 'destructive',
        });
        break;
      case 'audit_completed':
        toast({
          title: message.title || 'Audit Completed',
          description: message.message,
          variant: 'default',
        });
        break;
      case 'pong':
        // Handle ping-pong for connection health
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const subscribeToChannel = (channel: string) => {
    sendMessage({ type: 'subscribe', channel });
  };

  const unsubscribeFromChannel = (channel: string) => {
    sendMessage({ type: 'unsubscribe', channel });
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  // Ping-pong for connection health
  useEffect(() => {
    if (isConnected && ws) {
      const pingInterval = setInterval(() => {
        sendMessage({ type: 'ping' });
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [isConnected, ws]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        connectionStatus,
        sendMessage,
        subscribeToChannel,
        unsubscribeFromChannel,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}