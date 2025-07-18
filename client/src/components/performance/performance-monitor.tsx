import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, Clock, Users, Database, RefreshCw } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

interface PerformanceStats {
  server: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
  websocket: {
    totalConnections: number;
    uniqueUsers: number;
    connectedUsers: string[];
  };
  cache: {
    size: number;
    keys: string[];
  };
  timestamp: string;
}

export function PerformanceMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const clientMetrics = usePerformanceMonitor();

  const { data: serverStats, isLoading, refetch } = useQuery<PerformanceStats>({
    queryKey: ['/api/performance/stats'],
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if auto-refresh is enabled
  });

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getMemoryUsagePercent = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getConnectionStatusColor = (connections: number) => {
    if (connections > 50) return 'bg-red-500';
    if (connections > 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const clearCache = async (type: string) => {
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time system performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Server Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Server Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serverStats ? formatUptime(serverStats.server.uptime) : '0s'}
            </div>
            <p className="text-sm text-muted-foreground">
              System running time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Heap Used</span>
                <span>{serverStats ? serverStats.server.memory.heapUsed : 0} MB</span>
              </div>
              <Progress 
                value={serverStats ? getMemoryUsagePercent(serverStats.server.memory.heapUsed, serverStats.server.memory.heapTotal) : 0} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total: {serverStats ? serverStats.server.memory.heapTotal : 0} MB</span>
                <span>RSS: {serverStats ? serverStats.server.memory.rss : 0} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              WebSocket Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {serverStats ? serverStats.websocket.totalConnections : 0}
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor(serverStats?.websocket.totalConnections || 0)}`}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {serverStats ? serverStats.websocket.uniqueUsers : 0} unique users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Client Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium">Response Time</div>
              <div className="text-2xl font-bold">{clientMetrics.responseTime}ms</div>
              <Badge variant={clientMetrics.responseTime < 500 ? 'secondary' : clientMetrics.responseTime < 1000 ? 'outline' : 'destructive'}>
                {clientMetrics.responseTime < 500 ? 'Good' : clientMetrics.responseTime < 1000 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Error Rate</div>
              <div className="text-2xl font-bold">{clientMetrics.errorRate}%</div>
              <Badge variant={clientMetrics.errorRate < 1 ? 'secondary' : clientMetrics.errorRate < 5 ? 'outline' : 'destructive'}>
                {clientMetrics.errorRate < 1 ? 'Good' : clientMetrics.errorRate < 5 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Cache Hit Rate</div>
              <div className="text-2xl font-bold">{clientMetrics.cacheHitRate}%</div>
              <Badge variant={clientMetrics.cacheHitRate > 80 ? 'secondary' : clientMetrics.cacheHitRate > 60 ? 'outline' : 'destructive'}>
                {clientMetrics.cacheHitRate > 80 ? 'Good' : clientMetrics.cacheHitRate > 60 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Cache Size</div>
                <div className="text-sm text-muted-foreground">
                  {serverStats ? serverStats.cache.size : 0} items cached
                </div>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearCache('dashboard')}
                >
                  Clear Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearCache('audits')}
                >
                  Clear Audits
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearCache('actions')}
                >
                  Clear Actions
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearCache('all')}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {serverStats?.cache.keys && serverStats.cache.keys.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Active Cache Keys</div>
                <div className="flex flex-wrap gap-1">
                  {serverStats.cache.keys.slice(0, 10).map((key, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {key}
                    </Badge>
                  ))}
                  {serverStats.cache.keys.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{serverStats.cache.keys.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connected Users */}
      {serverStats?.websocket.connectedUsers && serverStats.websocket.connectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connected Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {serverStats.websocket.connectedUsers.map((user, index) => (
                <Badge key={index} variant="outline">
                  {user}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}