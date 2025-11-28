import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Server, 
  Users, 
  AlertTriangle, 
  Zap, 
  Settings, 
  Activity,
  Clock,
  Database,
  Network,
  Shield,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface SystemMetrics {
  activeUsers: number;
  activeAlerts: number;
  queueSize: number;
  processingRate: number;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  regions: RegionMetrics[];
}

interface RegionMetrics {
  id: string;
  name: string;
  activeUsers: number;
  activeAlerts: number;
  queueSize: number;
  status: 'healthy' | 'warning' | 'critical';
  lastSync: Date;
}

interface PriorityQueue {
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface BackgroundTask {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  region: string;
}

export const GlobalOpsMode: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    activeAlerts: 0,
    queueSize: 0,
    processingRate: 0,
    responseTime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    regions: []
  });
  const [priorityQueue, setPriorityQueue] = useState<PriorityQueue>({
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTask[]>([]);
  const [autoScaling, setAutoScaling] = useState(true);
  const [loadBalancing, setLoadBalancing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 5000) + 1000,
        activeAlerts: Math.floor(Math.random() * 200) + 50,
        queueSize: Math.floor(Math.random() * 1000) + 100,
        processingRate: Math.floor(Math.random() * 500) + 200,
        responseTime: Math.random() * 100 + 50,
        cpuUsage: Math.random() * 30 + 40,
        memoryUsage: Math.random() * 20 + 60,
        networkLatency: Math.random() * 50 + 10,
        regions: prev.regions.map(region => ({
          ...region,
          activeUsers: Math.floor(Math.random() * 1000) + 100,
          activeAlerts: Math.floor(Math.random() * 50) + 10,
          queueSize: Math.floor(Math.random() * 200) + 20,
          status: Math.random() > 0.8 ? 'warning' : Math.random() > 0.95 ? 'critical' : 'healthy',
          lastSync: new Date()
        }))
      }));

      setPriorityQueue(prev => ({
        high: Math.floor(Math.random() * 50) + 10,
        medium: Math.floor(Math.random() * 100) + 20,
        low: Math.floor(Math.random() * 200) + 50,
        total: 0
      }));

      setBackgroundTasks(prev => 
        prev.map(task => ({
          ...task,
          progress: task.status === 'running' ? Math.min(100, task.progress + Math.random() * 10) : task.progress,
          status: task.progress >= 100 ? 'completed' : task.status
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isEnabled]);

  // Initialize regions
  useEffect(() => {
    const regions = [
      { id: 'us-east', name: 'US East', activeUsers: 1200, activeAlerts: 45, queueSize: 150, status: 'healthy' as const, lastSync: new Date() },
      { id: 'us-west', name: 'US West', activeUsers: 800, activeAlerts: 30, queueSize: 100, status: 'healthy' as const, lastSync: new Date() },
      { id: 'eu-west', name: 'Europe West', activeUsers: 600, activeAlerts: 25, queueSize: 80, status: 'warning' as const, lastSync: new Date() },
      { id: 'asia-east', name: 'Asia East', activeUsers: 400, activeAlerts: 20, queueSize: 60, status: 'healthy' as const, lastSync: new Date() },
      { id: 'sa-east', name: 'South America', activeUsers: 300, activeAlerts: 15, queueSize: 40, status: 'critical' as const, lastSync: new Date() }
    ];

    setMetrics(prev => ({ ...prev, regions }));

    // Initialize background tasks
    const tasks: BackgroundTask[] = [
      {
        id: '1',
        name: 'Alert Processing Queue',
        status: 'running',
        progress: 45,
        startTime: new Date(Date.now() - 300000),
        region: 'us-east'
      },
      {
        id: '2',
        name: 'User Location Sync',
        status: 'running',
        progress: 78,
        startTime: new Date(Date.now() - 180000),
        region: 'global'
      },
      {
        id: '3',
        name: 'Database Optimization',
        status: 'queued',
        progress: 0,
        startTime: new Date(),
        region: 'global'
      }
    ];

    setBackgroundTasks(tasks);
  }, []);

  const handleToggleGlobalOps = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to enable/disable global ops mode
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEnabled(!isEnabled);
    } catch (error) {
      console.error('Error toggling global ops mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScaleRegion = async (regionId: string, action: 'scale-up' | 'scale-down') => {
    // Simulate scaling operation
    console.log(`Scaling ${action} for region ${regionId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Ops Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <CardTitle>Global Operations Mode</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggleGlobalOps}
                  disabled={isLoading}
                />
                <span className="text-sm font-medium">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <CardDescription>
            Scale service logic for thousands of active users and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoScaling}
                onCheckedChange={setAutoScaling}
                disabled={!isEnabled}
              />
              <span className="text-sm">Auto Scaling</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={loadBalancing}
                onCheckedChange={setLoadBalancing}
                disabled={!isEnabled}
              />
              <span className="text-sm">Load Balancing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <>
          {/* System Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.activeAlerts}</div>
                  <div className="text-sm text-gray-500">Active Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{metrics.queueSize}</div>
                  <div className="text-sm text-gray-500">Queue Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.processingRate}</div>
                  <div className="text-sm text-gray-500">Processing Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{metrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{metrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span>{metrics.responseTime.toFixed(0)}ms</span>
                  </div>
                  <Progress value={Math.min(100, metrics.responseTime / 2)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Priority Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{priorityQueue.high}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{priorityQueue.medium}</div>
                  <div className="text-sm text-gray-600">Medium Priority</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{priorityQueue.low}</div>
                  <div className="text-sm text-gray-600">Low Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Clusters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Regional Clusters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.regions.map((region) => (
                  <div key={region.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(region.status)}
                      <div>
                        <h4 className="font-semibold">{region.name}</h4>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>{region.activeUsers} users</span>
                          <span>{region.activeAlerts} alerts</span>
                          <span>{region.queueSize} in queue</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={region.status === 'healthy' ? 'default' : region.status === 'warning' ? 'secondary' : 'destructive'}>
                        {region.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScaleRegion(region.id, 'scale-up')}
                      >
                        Scale Up
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Background Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Background Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backgroundTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{task.name}</h4>
                        <Badge variant={
                          task.status === 'running' ? 'default' :
                          task.status === 'completed' ? 'secondary' :
                          task.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Region: {task.region}</span>
                        <span>Started: {task.startTime.toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{task.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}; 