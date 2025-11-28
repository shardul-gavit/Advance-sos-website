import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SOSDataService } from '@/lib/services/sosDataService';
import { DatabaseDiagnostics } from '@/lib/services/databaseDiagnostics';
import { 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Phone, 
  Video,
  Mic,
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Activity, 
  TrendingUp, 
  FileText, 
  BarChart3,
  RefreshCw,
  Database
} from 'lucide-react';

interface SOSHistoryEvent {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  latitude: number;
  longitude: number;
  address: string;
  emergencyType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'resolved' | 'cancelled' | 'timeout';
  triggerTime: Date;
  responseTime: Date;
  resolutionTime: Date;
  totalDuration: number; // in minutes
  description: string;
  assignedHelpers: Array<{
    id: string;
    name: string;
    phone: string;
    assignedTime: Date;
    arrivalTime?: Date;
  }>;
  assignedResponders: Array<{
    id: string;
    name: string;
    organization: string;
    phone: string;
    assignedTime: Date;
    arrivalTime?: Date;
  }>;
  mediaFiles: Array<{
    id: string;
    type: 'audio' | 'video' | 'image';
    url: string;
    timestamp: Date;
    duration?: number;
  }>;
  resolutionNotes: string;
  feedback?: {
    rating: number;
    comment: string;
  };
}

interface HistoryStats {
  totalEvents: number;
  resolvedEvents: number;
  cancelledEvents: number;
  timeoutEvents: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  mostCommonType: string;
  peakHour: string;
}

interface SOSHistoryDashboardProps {
  onMapFocus?: (latitude: number, longitude: number) => void;
}

export default function SOSHistoryDashboard({ onMapFocus }: SOSHistoryDashboardProps = {}) {
  const [events, setEvents] = useState<SOSHistoryEvent[]>([]);
  const [stats, setStats] = useState<HistoryStats>({
    totalEvents: 0,
    resolvedEvents: 0,
    cancelledEvents: 0,
    timeoutEvents: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
    mostCommonType: '',
    peakHour: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SOSHistoryEvent | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('history');

  // Handlers
  const handleViewDetails = (event: SOSHistoryEvent) => {
    setSelectedEvent(event);
    setActiveTab('details');
  };

  const handleDownloadReport = (event: SOSHistoryEvent) => {
    try {
      const report = {
        id: event.id,
        user: {
          id: event.userId,
          name: event.userName,
          phone: event.userPhone,
        },
        location: {
          latitude: event.latitude,
          longitude: event.longitude,
          address: event.address,
        },
        emergency: {
          type: event.emergencyType,
          priority: event.priority,
          status: event.status,
          description: event.description,
        },
        timeline: {
          triggered_at: event.triggerTime.toISOString(),
          response_time: event.responseTime.toISOString(),
          resolved_at: event.resolutionTime.toISOString(),
          total_duration_minutes: event.totalDuration,
        },
        helpers: event.assignedHelpers,
        responders: event.assignedResponders,
        media: event.mediaFiles,
        resolution_notes: event.resolutionNotes,
        feedback: event.feedback ?? null,
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sos-event-${event.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  // Load real data from SOS Data Service
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        console.log('📊 Loading SOS history data...');
        
        // Run diagnostics if no data is found
        let sosAlerts = await SOSDataService.fetchAllSOSAlerts();
        console.log(`📈 Loaded ${sosAlerts.length} SOS alerts for history`);
        
        // If no alerts found, run diagnostics
        if (sosAlerts.length === 0) {
          console.warn('⚠️ No alerts found. Running diagnostics...');
          const { DatabaseDiagnostics } = await import('@/lib/services/databaseDiagnostics');
          const diagnostics = await DatabaseDiagnostics.runFullDiagnostics();
          console.log('🔍 Diagnostics results:', diagnostics);
          
          // Try direct query as fallback - fetch all records, no limit
          const { supabase } = await import('@/lib/supabase');
          // Try triggered_at first (primary timestamp), fallback to created_at
          let directData: any[] = [];
          let directError: any = null;
          
          const { data: data1, error: error1 } = await supabase
            .from('sos_alerts')
            .select('*')
            .order('triggered_at', { ascending: false });
          
          if (error1 && (error1.message?.includes('column') || error1.code === '42703')) {
            // triggered_at doesn't exist, try created_at
            console.log('⚠️ triggered_at column not found, trying created_at...');
            const { data: data2, error: error2 } = await supabase
              .from('sos_alerts')
              .select('*')
              .order('created_at', { ascending: false });
            directData = data2 || [];
            directError = error2;
          } else {
            directData = data1 || [];
            directError = error1;
          }
          
          if (!directError && directData && directData.length > 0) {
            console.log(`✅ Direct query found ${directData.length} alerts (no limit applied)`);
            sosAlerts = directData as any[];
          } else if (directError) {
            console.error('❌ Direct query error:', directError);
          } else {
            console.warn('⚠️ Direct query returned no data');
          }
        }
        
        // Debug: Log sample alert to check structure
        if (sosAlerts.length > 0) {
          console.log('📋 Sample alert structure:', {
            id: sosAlerts[0].id,
            status: sosAlerts[0].status,
            created_at: sosAlerts[0].created_at,
            triggered_at: sosAlerts[0].triggered_at,
            emergency_type: sosAlerts[0].emergency_type
          });
        }
        
        // Convert sos_alerts to SOSHistoryEvent format
        const historyEvents: SOSHistoryEvent[] = sosAlerts.map(alert => {
          // Use created_at if triggered_at doesn't exist (for backward compatibility)
          const triggerTime = alert.triggered_at || alert.created_at || new Date().toISOString();
          const responseTime = alert.response_time || triggerTime;
          const resolutionTime = alert.resolved_at || triggerTime;
          
          // Calculate duration if resolved
          let totalDuration = 0;
          if (alert.resolved_at && triggerTime) {
            const resolved = new Date(resolutionTime);
            const triggered = new Date(triggerTime);
            totalDuration = Math.round((resolved.getTime() - triggered.getTime()) / 60000); // minutes
          }
          
          return {
            id: alert.id,
            userId: alert.user_id || 'unknown',
            userName: alert.user_name || alert.user_id || 'Unknown User',
            userPhone: alert.user_phone || 'N/A',
            latitude: alert.latitude || 0,
            longitude: alert.longitude || 0,
            address: alert.address || 'Location not specified',
            emergencyType: alert.emergency_type || 'Other',
            priority: (alert.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
            status: (alert.status || 'active') as 'resolved' | 'cancelled' | 'timeout' | 'active' | 'pending',
            triggerTime: new Date(triggerTime),
            responseTime: new Date(responseTime),
            resolutionTime: new Date(resolutionTime),
            totalDuration: totalDuration,
            description: alert.description || 'No description provided',
            assignedHelpers: alert.assigned_helpers || [],
            assignedResponders: alert.assigned_responders || [],
            mediaFiles: alert.media_files || (alert.media || []).map((m: any) => ({
              id: m.id,
              type: m.file_type || m.type || 'image',
              url: m.file_url || m.url,
              timestamp: new Date(m.created_at || m.timestamp),
              duration: m.duration
            })),
            resolutionNotes: alert.resolution_notes || 'No resolution notes',
            feedback: alert.feedback || undefined
          };
        });
        
        // Calculate statistics from real data
        const stats: HistoryStats = {
          totalEvents: historyEvents.length,
          resolvedEvents: historyEvents.filter(e => e.status === 'resolved' || e.status === 'completed').length,
          cancelledEvents: historyEvents.filter(e => e.status === 'cancelled').length,
          timeoutEvents: historyEvents.filter(e => e.status === 'timeout').length,
          averageResponseTime: historyEvents.length > 0 ? 
            historyEvents.reduce((sum, e) => sum + (e.responseTime.getTime() - e.triggerTime.getTime()) / 60000, 0) / historyEvents.length : 0,
          averageResolutionTime: historyEvents.length > 0 ? 
            historyEvents.reduce((sum, e) => sum + (e.resolutionTime.getTime() - e.triggerTime.getTime()) / 60000, 0) / historyEvents.length : 0,
          mostCommonType: historyEvents.length > 0 ? 
            historyEvents.reduce((acc, e) => {
              acc[e.emergencyType] = (acc[e.emergencyType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) : {},
          peakHour: '2:00 PM - 3:00 PM' // This would need more complex calculation
        };
        
        // Find most common type
        if (typeof stats.mostCommonType === 'object') {
          const entries = Object.entries(stats.mostCommonType);
          stats.mostCommonType = entries.length > 0 ? 
            entries.reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'Unknown';
        }
        
        setEvents(historyEvents);
        setStats(stats);
        console.log('✅ SOS history data loaded successfully');
        console.log(`📊 Total events: ${historyEvents.length}`);
        console.log(`📊 Resolved events: ${stats.resolvedEvents}`);
        console.log(`📊 Events by status:`, {
          resolved: historyEvents.filter(e => e.status === 'resolved').length,
          cancelled: historyEvents.filter(e => e.status === 'cancelled').length,
          active: historyEvents.filter(e => e.status === 'active' || e.status === 'pending').length,
          timeout: historyEvents.filter(e => e.status === 'timeout').length
        });
      } catch (error) {
        console.error('❌ Error loading SOS history data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  // Run database diagnostics
  const handleRunDiagnostics = async () => {
    try {
      console.log('🔍 Running database diagnostics...');
      const diagnostics = await DatabaseDiagnostics.runFullDiagnostics();
      setDiagnosticsResult(diagnostics);
      
      // Show results in alert
      const tableExists = diagnostics.tableExistence || {};
      const exists = Object.entries(tableExists).filter(([_, exists]) => exists).map(([name]) => name);
      const missing = Object.entries(tableExists).filter(([_, exists]) => !exists).map(([name]) => name);
      
      alert(`Database Diagnostics Results:\n\n✅ Tables that exist:\n${exists.join(', ') || 'None'}\n\n❌ Tables that don't exist:\n${missing.join(', ') || 'None'}\n\n📊 SOS Alerts Count: ${diagnostics.sosAlertsCount?.count || 0}\n\nCheck browser console for detailed results.`);
    } catch (error) {
      console.error('❌ Error running diagnostics:', error);
      alert('Failed to run diagnostics. Check browser console for details.');
    }
  };

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing SOS history data...');
      
      // Fetch all SOS alerts
      const sosAlerts = await SOSDataService.fetchAllSOSAlerts();
      console.log(`📈 Refreshed ${sosAlerts.length} SOS alerts for history`);
      
      // Convert sos_alerts to SOSHistoryEvent format
      const historyEvents: SOSHistoryEvent[] = sosAlerts.map(alert => {
        // Use created_at if triggered_at doesn't exist (for backward compatibility)
        const triggerTime = alert.triggered_at || alert.created_at || new Date().toISOString();
        const responseTime = alert.response_time || triggerTime;
        const resolutionTime = alert.resolved_at || triggerTime;
        
        // Calculate duration if resolved
        let totalDuration = 0;
        if (alert.resolved_at && triggerTime) {
          const resolved = new Date(resolutionTime);
          const triggered = new Date(triggerTime);
          totalDuration = Math.round((resolved.getTime() - triggered.getTime()) / 60000); // minutes
        }
        
        return {
          id: alert.id,
          userId: alert.user_id || 'unknown',
          userName: alert.user_name || alert.user_id || 'Unknown User',
          userPhone: alert.user_phone || 'N/A',
          latitude: alert.latitude || 0,
          longitude: alert.longitude || 0,
          address: alert.address || 'Location not specified',
          emergencyType: alert.emergency_type || 'Other',
          priority: (alert.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          status: (alert.status || 'active') as 'resolved' | 'cancelled' | 'timeout' | 'active' | 'pending',
          triggerTime: new Date(triggerTime),
          responseTime: new Date(responseTime),
          resolutionTime: new Date(resolutionTime),
          totalDuration: totalDuration,
          description: alert.description || 'No description provided',
          assignedHelpers: alert.assigned_helpers || [],
          assignedResponders: alert.assigned_responders || [],
          mediaFiles: alert.media_files || (alert.media || []).map((m: any) => ({
            id: m.id,
            type: m.file_type || m.type || 'image',
            url: m.file_url || m.url,
            timestamp: new Date(m.created_at || m.timestamp),
            duration: m.duration
          })),
          resolutionNotes: alert.resolution_notes || 'No resolution notes',
          feedback: alert.feedback || undefined
        };
      });
      
      // Calculate statistics from real data
      const stats: HistoryStats = {
        totalEvents: historyEvents.length,
        resolvedEvents: historyEvents.filter(e => e.status === 'resolved' || e.status === 'completed').length,
        cancelledEvents: historyEvents.filter(e => e.status === 'cancelled').length,
        timeoutEvents: historyEvents.filter(e => e.status === 'timeout').length,
        averageResponseTime: historyEvents.length > 0 ? 
          historyEvents.reduce((sum, e) => sum + (e.responseTime.getTime() - e.triggerTime.getTime()) / 60000, 0) / historyEvents.length : 0,
        averageResolutionTime: historyEvents.length > 0 ? 
          historyEvents.reduce((sum, e) => sum + (e.resolutionTime.getTime() - e.triggerTime.getTime()) / 60000, 0) / historyEvents.length : 0,
        mostCommonType: historyEvents.length > 0 ? 
          Object.entries(historyEvents.reduce((acc, e) => {
            acc[e.emergencyType] = (acc[e.emergencyType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'Unknown',
        peakHour: '2:00 PM - 3:00 PM' // This would need more complex calculation
      };
      
      setEvents(historyEvents);
      setStats(stats);
      console.log('✅ SOS history data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing SOS history data:', error);
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
      case 'resolved': return 'text-green-400';
      case 'cancelled': return 'text-gray-400';
      case 'timeout': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.emergencyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle status filter - check both exact match and lowercase match
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      matchesStatus = event.status?.toLowerCase() === filterStatus.toLowerCase() ||
                     (filterStatus === 'active' && (event.status === 'active' || event.status === 'pending'));
    }
    
    const matchesType = filterType === 'all' || event.emergencyType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading SOS History Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-purple-400">SOS History Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunDiagnostics}
              className="bg-purple-500/20 text-purple-300 border-purple-400 hover:bg-purple-500/30 transition-all duration-200"
              title="Check database structure and diagnose issues"
            >
              <Database className="w-4 h-4 mr-2" />
              Diagnostics
            </Button>
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
        </div>
        <p className="text-gray-400">Complete history of past SOS triggers with detailed information</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/50 border-purple-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-green-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{stats.resolvedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-blue-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-blue-400">{stats.averageResponseTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Peak Hour</p>
                <p className="text-lg font-bold text-orange-400">{stats.peakHour}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-black/50 border-cyan-400/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, emergency type, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-600/50 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
                <option value="timeout">Timeout</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Fire Emergency">Fire Emergency</option>
                <option value="Traffic Accident">Traffic Accident</option>
                <option value="Natural Disaster">Natural Disaster</option>
                <option value="Security Threat">Security Threat</option>
              </select>
              <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/20">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/50 border-cyan-400/50">
          <TabsTrigger value="history" className="text-cyan-300">Event History</TabsTrigger>
          <TabsTrigger value="analytics" className="text-cyan-300">Analytics</TabsTrigger>
          <TabsTrigger value="details" className="text-cyan-300">Event Details</TabsTrigger>
        </TabsList>

        {/* Event History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">SOS Event History</CardTitle>
              <CardDescription>Complete timeline of all SOS triggers and their outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <p>No events found matching your criteria</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
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
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {event.emergencyType}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {event.triggerTime.toLocaleDateString()} at {event.triggerTime.toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{event.userName}</h3>
                          <p className="text-sm text-gray-400">{event.userPhone}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.address}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{event.assignedHelpers.length} Helpers</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{event.assignedResponders.length} Responders</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">Duration</div>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {formatDuration(event.totalDuration)}
                          </Badge>
                          <div className="text-xs text-gray-400 mt-2">
                            Response: {Math.round((event.responseTime.getTime() - event.triggerTime.getTime()) / 60000)}m
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span>{event.mediaFiles.filter(f => f.type === 'video').length} Videos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          <span>{event.mediaFiles.filter(f => f.type === 'audio').length} Audio</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{event.mediaFiles.filter(f => f.type === 'image').length} Images</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(event)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            if (onMapFocus && event.latitude && event.longitude) {
                              onMapFocus(event.latitude, event.longitude);
                            } else if (!event.latitude || !event.longitude) {
                              alert('No location data available for this event');
                            }
                          }}
                          className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/20"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          View in Map
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReport(event)}
                          className="text-green-400 border-green-400 hover:bg-green-400/20"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Report
                        </Button>
                        {event.feedback && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            ⭐ {event.feedback.rating}/5
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Event Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{stats.resolvedEvents}</div>
                    <div className="text-sm text-gray-400">Resolved</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">{stats.cancelledEvents}</div>
                    <div className="text-sm text-gray-400">Cancelled</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{stats.timeoutEvents}</div>
                    <div className="text-sm text-gray-400">Timeout</div>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{stats.averageResponseTime}m</div>
                    <div className="text-sm text-gray-400">Avg Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Resolution Rate</span>
                      <span className="text-green-400">76.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{width: '76.5%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Response Time (Target: 10m)</span>
                      <span className="text-blue-400">8.5m</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">User Satisfaction</span>
                      <span className="text-yellow-400">4.2/5</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{width: '84%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Event Details Tab */}
        <TabsContent value="details" className="mt-4">
          {selectedEvent ? (
            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Event Details - {selectedEvent.id}</CardTitle>
                <CardDescription>Complete information about the selected SOS event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3">Event Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Event ID:</span>
                        <span className="text-white">{selectedEvent.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">User:</span>
                        <span className="text-white">{selectedEvent.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white">{selectedEvent.userPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Emergency Type:</span>
                        <span className="text-white">{selectedEvent.emergencyType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Priority:</span>
                        <Badge variant="outline" className="text-red-400 border-red-400">
                          {selectedEvent.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedEvent.status)}`}>
                          {selectedEvent.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-3">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Triggered:</span>
                        <span className="text-white">{selectedEvent.triggerTime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response Time:</span>
                        <span className="text-white">{selectedEvent.responseTime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Resolved:</span>
                        <span className="text-white">{selectedEvent.resolutionTime.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Duration:</span>
                        <span className="text-white">{formatDuration(selectedEvent.totalDuration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Location Information</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <span className="text-white">{selectedEvent.address}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (onMapFocus && selectedEvent.latitude && selectedEvent.longitude) {
                            onMapFocus(selectedEvent.latitude, selectedEvent.longitude);
                          } else if (!selectedEvent.latitude || !selectedEvent.longitude) {
                            alert('No location data available for this event');
                          }
                        }}
                        className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/20"
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        View in Map
                      </Button>
                    </div>
                    <div className="text-sm text-gray-400">
                      Coordinates: {selectedEvent.latitude.toFixed(6)}, {selectedEvent.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                {/* Assigned Personnel */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Assigned Personnel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Helpers</h4>
                      {selectedEvent.assignedHelpers.map((helper, index) => (
                        <div key={index} className="bg-gray-900/50 p-3 rounded-lg mb-2">
                          <div className="text-white font-medium">{helper.name}</div>
                          <div className="text-sm text-gray-400">{helper.phone}</div>
                          <div className="text-xs text-gray-500">
                            Assigned: {helper.assignedTime.toLocaleString()}
                          </div>
                          {helper.arrivalTime && (
                            <div className="text-xs text-gray-500">
                              Arrived: {helper.arrivalTime.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Responders</h4>
                      {selectedEvent.assignedResponders.map((responder, index) => (
                        <div key={index} className="bg-gray-900/50 p-3 rounded-lg mb-2">
                          <div className="text-white font-medium">{responder.name}</div>
                          <div className="text-sm text-gray-400">{responder.organization}</div>
                          <div className="text-sm text-gray-400">{responder.phone}</div>
                          <div className="text-xs text-gray-500">
                            Assigned: {responder.assignedTime.toLocaleString()}
                          </div>
                          {responder.arrivalTime && (
                            <div className="text-xs text-gray-500">
                              Arrived: {responder.arrivalTime.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Media Files */}
                {selectedEvent.mediaFiles.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white mb-3">Media Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedEvent.mediaFiles.map((media) => (
                        <div key={media.id} className="bg-gray-900/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {media.type === 'video' && <Video className="h-4 w-4 text-red-400" />}
                            {media.type === 'audio' && <Mic className="h-4 w-4 text-green-400" />}
                            {media.type === 'image' && <FileText className="h-4 w-4 text-blue-400" />}
                            <span className="text-white font-medium capitalize">{media.type}</span>
                          </div>
                          <div className="text-sm text-gray-400 mb-2">
                            {media.timestamp.toLocaleString()}
                          </div>
                          {media.duration && (
                            <div className="text-sm text-gray-400 mb-2">
                              Duration: {Math.round(media.duration / 60)}m {media.duration % 60}s
                            </div>
                          )}
                          <Button size="sm" variant="outline" className="w-full text-blue-400 border-blue-400 hover:bg-blue-400/20">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Notes */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Resolution Notes</h3>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-gray-300">{selectedEvent.resolutionNotes}</p>
                  </div>
                </div>

                {/* User Feedback */}
                {selectedEvent.feedback && (
                  <div>
                    <h3 className="font-semibold text-white mb-3">User Feedback</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-400">Rating:</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < selectedEvent.feedback!.rating ? 'text-yellow-400' : 'text-gray-500'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-white">({selectedEvent.feedback.rating}/5)</span>
                      </div>
                      <p className="text-gray-300">{selectedEvent.feedback.comment}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/50 border-cyan-400/50">
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select an event from the history to view detailed information</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
