import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SOSDataService } from '@/lib/services/sosDataService';
import { SOSEvent } from '@/types/sos';
import { 
  Radio, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  Video,
  Mic,
  Zap,
  Activity,
  TrendingUp,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RefreshCw
} from 'lucide-react';


interface RealtimeMetrics {
  activeEvents: number;
  totalToday: number;
  averageResponseTime: number;
  resolvedToday: number;
  activeStreams: number;
}

interface RealtimeSOSDashboardProps {
  onSOSTrigger?: (sosEvent: SOSEvent) => void;
  onMapFocus?: (latitude: number, longitude: number) => void;
  onViewStream?: (event: SOSEvent) => void;
  onCallUser?: (event: SOSEvent) => void;
  onResolveEvent?: (event: SOSEvent) => void;
}

export default function RealtimeSOSDashboard({ onSOSTrigger, onMapFocus, onViewStream, onCallUser, onResolveEvent }: RealtimeSOSDashboardProps = {}) {
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    activeEvents: 0,
    totalToday: 0,
    averageResponseTime: 0,
    resolvedToday: 0,
    activeStreams: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SOSEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real-time SOS data and set up subscriptions
  useEffect(() => {
    const loadRealtimeData = async () => {
      try {
        console.log('🚨 Loading real-time SOS data...');
        
        // Fetch active SOS alerts
        const sosAlerts = await SOSDataService.fetchActiveSOSAlerts();
        console.log(`📊 Loaded ${sosAlerts.length} active SOS alerts`);
        
        // Convert sos_alerts to SOSEvent format
        const realtimeEvents: SOSEvent[] = sosAlerts.map(alert => ({
          id: alert.id,
          userId: alert.user_id || 'unknown',
          userName: alert.user_name || 'Unknown User',
          latitude: alert.latitude || 0,
          longitude: alert.longitude || 0,
          emergencyType: alert.emergency_type || 'Other',
          priority: alert.priority || 'medium',
          status: alert.status || 'active',
          timestamp: new Date(alert.triggered_at || new Date()),
          description: alert.description || 'No description provided',
          assignedHelpers: alert.assigned_helpers || [],
          assignedResponders: alert.assigned_responders || [],
          mediaStreams: {
            audio: alert.audio_enabled || false,
            video: alert.video_enabled || false
          }
        }));
        
        setSosEvents(realtimeEvents);
        
        // Calculate real-time metrics
        const stats = await SOSDataService.getSOSStatistics();
        const realtimeMetrics: RealtimeMetrics = {
          activeEvents: stats.active,
          totalToday: stats.recent24h,
          averageResponseTime: stats.avgResponseTime || 0,
          resolvedToday: stats.resolved,
          activeStreams: realtimeEvents.filter(e => e.mediaStreams.audio || e.mediaStreams.video).length
        };
        
        setMetrics(realtimeMetrics);
        console.log('✅ Real-time SOS data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading real-time SOS data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRealtimeData();

    // Set up real-time subscription for new SOS triggers
    const subscription = SOSDataService.subscribeToSOSAlerts((payload) => {
      console.log('🔄 Real-time SOS update received:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new) {
        // New SOS trigger detected
        const newAlert = payload.new;
        const newSOSEvent: SOSEvent = {
          id: newAlert.id,
          userId: newAlert.user_id || 'unknown',
          userName: newAlert.user_name || 'Unknown User',
          latitude: newAlert.latitude || 0,
          longitude: newAlert.longitude || 0,
          emergencyType: newAlert.emergency_type || 'Other',
          priority: newAlert.priority || 'medium',
          status: newAlert.status || 'active',
          timestamp: new Date(newAlert.triggered_at || new Date()),
          description: newAlert.description || 'No description provided',
          assignedHelpers: newAlert.assigned_helpers || [],
          assignedResponders: newAlert.assigned_responders || [],
          mediaStreams: {
            audio: newAlert.audio_enabled || false,
            video: newAlert.video_enabled || false
          }
        };

        // Add to current events
        setSosEvents(prev => [newSOSEvent, ...prev]);
        
        // Update metrics
        setMetrics(prev => ({
          ...prev,
          activeEvents: prev.activeEvents + 1,
          totalToday: prev.totalToday + 1,
          activeStreams: prev.activeStreams + (newSOSEvent.mediaStreams.audio || newSOSEvent.mediaStreams.video ? 1 : 0)
        }));

        // Notify parent component about new SOS trigger
        if (onSOSTrigger) {
          onSOSTrigger(newSOSEvent);
        }

        // Focus map on new SOS location
        if (onMapFocus && newAlert.latitude && newAlert.longitude) {
          onMapFocus(newAlert.latitude, newAlert.longitude);
        }

        console.log('🚨 New SOS trigger detected and processed:', newSOSEvent);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Update existing SOS event
        const updatedAlert = payload.new;
        setSosEvents(prev => prev.map(event => 
          event.id === updatedAlert.id 
            ? {
                ...event,
                status: updatedAlert.status || event.status,
                assignedHelpers: updatedAlert.assigned_helpers || event.assignedHelpers,
                assignedResponders: updatedAlert.assigned_responders || event.assignedResponders,
                mediaStreams: {
                  audio: updatedAlert.audio_enabled || event.mediaStreams.audio,
                  video: updatedAlert.video_enabled || event.mediaStreams.video
                }
              }
            : event
        ));
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove resolved/cancelled SOS event
        setSosEvents(prev => prev.filter(event => event.id !== payload.old.id));
        setMetrics(prev => ({
          ...prev,
          activeEvents: Math.max(0, prev.activeEvents - 1),
          resolvedToday: prev.resolvedToday + 1
        }));
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [onSOSTrigger, onMapFocus]);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing real-time SOS data...');
      
      // Fetch fresh data
      const sosAlerts = await SOSDataService.fetchActiveSOSAlerts();
      console.log(`📊 Refreshed ${sosAlerts.length} active SOS alerts`);
      
      // Convert sos_alerts to SOSEvent format
      const realtimeEvents: SOSEvent[] = sosAlerts.map(alert => ({
        id: alert.id,
        userId: alert.user_id || 'unknown',
        userName: alert.user_name || 'Unknown User',
        latitude: alert.latitude || 0,
        longitude: alert.longitude || 0,
        emergencyType: alert.emergency_type || 'Other',
        priority: alert.priority || 'medium',
        status: alert.status || 'active',
        timestamp: new Date(alert.triggered_at || new Date()),
        description: alert.description || 'No description provided',
        assignedHelpers: alert.assigned_helpers || [],
        assignedResponders: alert.assigned_responders || [],
        mediaStreams: {
          audio: alert.audio_enabled || false,
          video: alert.video_enabled || false
        }
      }));
      
      setSosEvents(realtimeEvents);
      
      // Calculate real-time metrics
      const stats = await SOSDataService.getSOSStatistics();
      const realtimeMetrics: RealtimeMetrics = {
        activeEvents: stats.active,
        totalToday: stats.recent24h,
        averageResponseTime: stats.avgResponseTime || 0,
        resolvedToday: stats.resolved,
        activeStreams: realtimeEvents.filter(e => e.mediaStreams.audio || e.mediaStreams.video).length
      };
      
      setMetrics(realtimeMetrics);
      console.log('✅ Real-time SOS data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing real-time SOS data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400';
      case 'responding': return 'text-yellow-400';
      case 'resolved': return 'text-green-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading Real-time SOS Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Radio className="h-8 w-8 text-red-400" />
            <h1 className="text-2xl font-bold text-red-400">Real-time SOS Dashboard</h1>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-gray-400">Live emergency monitoring and response coordination</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-black/50 border-red-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Active Events</p>
                <p className="text-2xl font-bold text-red-400">{metrics.activeEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-blue-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Today</p>
                <p className="text-2xl font-bold text-blue-400">{metrics.totalToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-green-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-green-400">{metrics.averageResponseTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-purple-400">{metrics.resolvedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-cyan-400/50">
          <CardContent className="p4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm text-gray-400">Active Streams</p>
                <p className="text-2xl font-bold text-cyan-400">{metrics.activeStreams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live-events" className="h-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/50 border-cyan-400/50">
          <TabsTrigger value="live-events" className="text-cyan-300">Live Events</TabsTrigger>
          <TabsTrigger value="streams" className="text-cyan-300">Media Streams</TabsTrigger>
          <TabsTrigger value="service" className="text-cyan-300">Service</TabsTrigger>
        </TabsList>

        {/* Live Events Tab */}
        <TabsContent value="live-events" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">Active SOS Events</CardTitle>
              <CardDescription>Real-time emergency events requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sosEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <p>No active SOS events</p>
                </div>
              ) : (
                sosEvents.map((event) => (
                  <Card key={event.id} className="bg-gray-900/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)}`}></div>
                          <Badge variant="outline" className="text-red-400 border-red-400">
                            {event.priority.toUpperCase()}
                          </Badge>
                          <span className={`text-sm font-medium ${getStatusColor(event.status)}`}>
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {event.timestamp.toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-white mb-2">{event.emergencyType}</h3>
                          <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            <span>{event.userName}</span>
                            <MapPin className="h-4 w-4 ml-2" />
                            <span>{event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Video className={`h-4 w-4 ${event.mediaStreams.video ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className="text-sm text-gray-400">Video Stream</span>
                            <Badge variant={event.mediaStreams.video ? 'default' : 'secondary'}>
                              {event.mediaStreams.video ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mic className={`h-4 w-4 ${event.mediaStreams.audio ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className="text-sm text-gray-400">Audio Stream</span>
                            <Badge variant={event.mediaStreams.audio ? 'default' : 'secondary'}>
                              {event.mediaStreams.audio ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-gray-400">
                              {event.assignedHelpers.length} Helpers, {event.assignedResponders.length} Responders
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-400 border-red-400 hover:bg-red-400/20"
                          onClick={() => onViewStream?.(event)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          View Stream
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                          onClick={() => onCallUser?.(event)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call User
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/20"
                          onClick={() => onMapFocus?.(event.latitude, event.longitude)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Focus Map
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-400 border-green-400 hover:bg-green-400/20"
                          onClick={() => onResolveEvent?.(event)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Streams Tab */}
        <TabsContent value="streams" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">Media Streams</CardTitle>
              <CardDescription>Live audio and video streams from emergency scenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sosEvents.filter(e => e.mediaStreams.video || e.mediaStreams.audio).map((event) => (
                  <Card key={event.id} className="bg-gray-900/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-white">{event.userName}</h3>
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          {event.priority.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        {event.mediaStreams.video ? (
                          <div className="text-center">
                            <Video className="h-8 w-8 text-green-400 mx-auto mb-2" />
                            <p className="text-sm text-green-400">Video Stream Active</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Video className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No Video</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className={`h-4 w-4 ${event.mediaStreams.audio ? 'text-green-400' : 'text-gray-500'}`} />
                          <span className="text-sm text-gray-400">
                            {event.mediaStreams.audio ? 'Audio Active' : 'No Audio'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tab */}
        <TabsContent value="service" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">Real-time Service Status</CardTitle>
              <CardDescription>System performance and orchestration metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900/50 border-gray-600/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-3">System Health</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">CPU Usage</span>
                          <span className="text-green-400">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Memory Usage</span>
                          <span className="text-yellow-400">67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Network Latency</span>
                          <span className="text-green-400">12ms</span>
                        </div>
                        <Progress value={20} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-600/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-3">Orchestration Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Connections</span>
                        <span className="text-cyan-400">127</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stream Quality</span>
                        <span className="text-green-400">HD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time</span>
                        <span className="text-green-400">0.3s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-green-400">99.9%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-green-900/50 border-green-400/50">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Real-time service is operating normally. All systems are functioning within optimal parameters.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
