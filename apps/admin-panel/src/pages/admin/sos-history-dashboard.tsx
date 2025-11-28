import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  Search, 
  RefreshCw, 
  Database, 
  Eye, 
  MapPin, 
  Users, 
  User, 
  BarChart3, 
  Zap,
  Lock,
  Maximize2,
  Wifi,
  Settings,
  ChevronDown,
  Filter,
  Activity,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  Timer,
  Target,
  Shield,
  Power
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APIService } from '@/lib/services/api';
import { RealtimeService } from '@/lib/services/realtime';
import { SOSDataService } from '@/lib/services/sosDataService';
import { SOSEvent, Helper, Responder } from '@/types/sos';

interface SOSHistoryEvent extends SOSEvent {
  resolution_time?: number;
  helpers_involved?: number;
  responders_involved?: number;
  success_rate?: number;
}

const SOSHistoryDashboard: React.FC = () => {
  const [sosEvents, setSosEvents] = useState<SOSHistoryEvent[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<SOSHistoryEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Statistics
  const [stats, setStats] = useState({
    totalEvents: 0,
    resolved: 0,
    cancelled: 0,
    avgResolution: 0,
    mostCommonEmergency: 'None',
    helpersInvolved: 0,
    respondersInvolved: 0,
    successRate: 0
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Use SOSDataService for SOS events (correct table: sos_alerts)
        const sosAlerts = await SOSDataService.fetchAllSOSAlerts();
        
        // Convert sos_alerts to sos_events format for compatibility
        const convertedEvents = sosAlerts.map(alert => ({
          id: alert.id,
          user_id: alert.user_id || 'unknown',
          emergency_type: alert.emergency_type || 'other',
          description: alert.description || '',
          latitude: alert.latitude || 0,
          longitude: alert.longitude || 0,
          address: alert.address || '',
          priority: alert.priority || 'medium',
          status: alert.status || 'active',
          assigned_helper_id: alert.assigned_helper_id || null,
          assigned_responder_id: alert.assigned_responder_id || null,
          is_test: alert.is_test || false,
          resolved_at: alert.resolved_at || null,
          created_at: alert.triggered_at || new Date().toISOString(),
          updated_at: alert.updated_at || new Date().toISOString(),
        }));
        
        setSosEvents(convertedEvents);
        calculateStats(convertedEvents);
        
        // Load helpers and responders using existing API service
        const [helpersRes, respondersRes] = await Promise.all([
          APIService.getHelpers(),
          APIService.getResponders(),
        ]);

        if (!helpersRes.error) setHelpers(helpersRes.helpers);
        if (!respondersRes.error) setResponders(respondersRes.responders);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for SOS History Dashboard...');
    
    // Subscribe to sos_alerts changes using SOSDataService
    const subscription = SOSDataService.subscribeToSOSAlerts((payload) => {
      console.log('📡 SOS Alert update received in History Dashboard:', payload);
      
      if (payload.eventType === 'INSERT' && payload.new) {
        // Convert new alert to SOSEvent format
        const newAlert = payload.new;
        const newSOSEvent = {
          id: newAlert.id,
          user_id: newAlert.user_id || 'unknown',
          emergency_type: newAlert.emergency_type || 'other',
          description: newAlert.description || '',
          latitude: newAlert.latitude || 0,
          longitude: newAlert.longitude || 0,
          address: newAlert.address || '',
          priority: newAlert.priority || 'medium',
          status: newAlert.status || 'active',
          assigned_helper_id: newAlert.assigned_helper_id || null,
          assigned_responder_id: newAlert.assigned_responder_id || null,
          is_test: newAlert.is_test || false,
          resolved_at: newAlert.resolved_at || null,
          created_at: newAlert.triggered_at || new Date().toISOString(),
          updated_at: newAlert.updated_at || new Date().toISOString(),
        };
        
        setSosEvents(prev => [newSOSEvent, ...prev]);
        calculateStats([newSOSEvent, ...sosEvents]);
        setLastUpdate(new Date());
        console.log('✅ New SOS alert added to history dashboard');
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Update existing alert
        const updatedAlert = payload.new;
        setSosEvents(prev => {
          const updated = prev.map(event => 
            event.id === updatedAlert.id 
              ? {
                  ...event,
                  status: updatedAlert.status || event.status,
                  priority: updatedAlert.priority || event.priority,
                  description: updatedAlert.description || event.description,
                  resolved_at: updatedAlert.resolved_at || event.resolved_at,
                  updated_at: updatedAlert.updated_at || event.updated_at,
                }
              : event
          );
          calculateStats(updated);
          return updated;
        });
        setLastUpdate(new Date());
        console.log('✅ SOS alert updated in history dashboard');
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove deleted alert
        setSosEvents(prev => {
          const filtered = prev.filter(event => event.id !== payload.old.id);
          calculateStats(filtered);
          return filtered;
        });
        setLastUpdate(new Date());
        console.log('✅ SOS alert removed from history dashboard');
      }
    });

    console.log('✅ Real-time subscriptions established for SOS History Dashboard');

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('🔄 Real-time subscriptions cleaned up for SOS History Dashboard');
      }
    };
  }, [sosEvents]);

  const calculateStats = (events: SOSHistoryEvent[]) => {
    const totalEvents = events.length;
    const resolved = events.filter(e => e.status === 'resolved').length;
    const cancelled = events.filter(e => e.status === 'cancelled').length;
    
    // Calculate average resolution time (mock data for now)
    const avgResolution = resolved > 0 ? Math.round(Math.random() * 30 + 5) : 0;
    
    // Find most common emergency type
    const emergencyTypes = events.reduce((acc, event) => {
      acc[event.emergency_type] = (acc[event.emergency_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonEmergency = Object.keys(emergencyTypes).length > 0 
      ? Object.keys(emergencyTypes).reduce((a, b) => emergencyTypes[a] > emergencyTypes[b] ? a : b)
      : 'None';

    const helpersInvolved = events.reduce((sum, event) => sum + (event.helpers_involved || 0), 0);
    const respondersInvolved = events.reduce((sum, event) => sum + (event.responders_involved || 0), 0);
    const successRate = totalEvents > 0 ? Math.round((resolved / totalEvents) * 100) : 0;

    setStats({
      totalEvents,
      resolved,
      cancelled,
      avgResolution,
      mostCommonEmergency,
      helpersInvolved,
      respondersInvolved,
      successRate
    });
  };

  const filteredEvents = sosEvents.filter(event => {
    const matchesSearch = event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.emergency_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = async () => {
    try {
      // Use SOSDataService for refresh (correct table: sos_alerts)
      const sosAlerts = await SOSDataService.fetchAllSOSAlerts();
      
      // Convert sos_alerts to sos_events format for compatibility
      const convertedEvents = sosAlerts.map(alert => ({
        id: alert.id,
        user_id: alert.user_id || 'unknown',
        emergency_type: alert.emergency_type || 'other',
        description: alert.description || '',
        latitude: alert.latitude || 0,
        longitude: alert.longitude || 0,
        address: alert.address || '',
        priority: alert.priority || 'medium',
        status: alert.status || 'active',
        assigned_helper_id: alert.assigned_helper_id || null,
        assigned_responder_id: alert.assigned_responder_id || null,
        is_test: alert.is_test || false,
        resolved_at: alert.resolved_at || null,
        created_at: alert.triggered_at || new Date().toISOString(),
        updated_at: alert.updated_at || new Date().toISOString(),
      }));
      
      setSosEvents(convertedEvents);
      calculateStats(convertedEvents);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}m ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 shadow-[0_0_20px_#00fff7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-mono text-white">
      {/* Fixed Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-black/95 border-b border-cyan-400/50 z-50 shadow-[0_0_8px_#00fff7]">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Left: Title */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-cyan-300">SOS Command ||</span>
          </div>
          
          {/* Center: Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">STATUS: OPERATIONAL</span>
              </div>
              <div className="w-px h-5 bg-cyan-400/30"></div>
              <span className="text-green-400 font-medium">POWER: STABLE</span>
              <div className="w-px h-5 bg-cyan-400/30"></div>
              <span className="text-green-400 font-medium">SECURITY: SECURE</span>
            </div>
          </div>
          
          {/* Right: Control Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-green-500/20 text-green-300 border-green-400 hover:bg-green-500/30 transition-all duration-200 text-sm"
            >
              <Lock className="w-3 h-3 mr-1" />
              Encryption
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/20 text-red-300 border-red-400 hover:bg-red-500/30 transition-all duration-200 text-sm"
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              Fullscreen Mode
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-500/20 text-blue-300 border-blue-400 hover:bg-blue-500/30 transition-all duration-200 text-sm"
            >
              <Wifi className="w-3 h-3 mr-1" />
              Connection Mode
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-500/20 text-red-300 border-red-400 hover:bg-red-500/30 transition-all duration-200 text-sm"
            >
              <Settings className="w-3 h-3 mr-1" />
              Manual Override
            </Button>
            <Button
              size="sm"
              className="bg-green-500/20 text-green-300 border-green-400 hover:bg-green-500/30 transition-all duration-200 text-sm"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Below Fixed Header */}
      <main className="pt-14 h-screen bg-black">
        <div className="grid grid-cols-12 gap-4 h-full p-4">
          
          {/* Left Sidebar - 2 columns */}
          <div className="col-span-2 flex flex-col space-y-4 h-full">
            
            {/* HELPERS & RESPONDERS Panel */}
            <Card className="bg-black/50 border-cyan-400/50 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-sm font-medium">HELPERS & RESPONDERS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-cyan-400" />
                    Vadodara, India
                  </div>
                  <div className="ml-4 text-xs text-gray-500">
                    <div>22.3321, 73.1586</div>
                    <div>Accuracy: ±5000m</div>
                    <div>Updated: {currentTime.toLocaleTimeString()}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">ACTIVE RESPONDERS</div>
                    <div className="text-gray-500">{responders.filter(r => r.status === 'available').length} available</div>
                  </div>

                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">ALL HELPERS</div>
                    <div className="text-gray-500">{helpers.filter(h => h.status === 'available').length} available</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COMMAND & CONTROL Panel */}
            <Card className="bg-black/50 border-cyan-400/50 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-sm font-medium">COMMAND & CONTROL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-sm py-2 bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-200"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                  Incidents
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-sm py-2 bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-200"
                >
                  <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                  Map View
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-sm py-2 bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-200"
                >
                  <Activity className="w-4 h-4 mr-2 text-green-400" />
                  HLS Streaming
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-sm py-2 bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 transition-all duration-200"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                  Real-Time SOS
                </Button>

                <Button
                  size="sm"
                  className="w-full text-sm py-2 bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_8px_#a855f7] transition-all duration-200"
                >
                  <Clock className="w-4 h-4 mr-2 text-purple-400" />
                  SOS History
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area - 8 columns */}
          <div className="col-span-8 overflow-hidden">
            <div className="w-full h-full space-y-4">
              
              {/* Dashboard Title */}
              <div className="text-center py-4">
                <h1 className="text-2xl font-bold text-cyan-300 mb-2">SOS History Dashboard</h1>
                <p className="text-gray-400 text-sm">Complete emergency response history and analytics</p>
              </div>


              {/* Live Connection Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Connected</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Last Update: {formatTimeAgo(lastUpdate)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    className="bg-purple-500/20 text-purple-300 border-purple-400 hover:bg-purple-500/30 text-sm"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-orange-500/20 text-orange-300 border-orange-400 hover:bg-orange-500/30 text-sm"
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Debug DB
                  </Button>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-black/50 border-cyan-400/50">
                  <CardContent className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-lg font-bold text-white">{stats.totalEvents}</span>
                    </div>
                    <div className="text-xs text-gray-400">Total Events</div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-green-400/50">
                  <CardContent className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-lg font-bold text-white">{stats.resolved}</span>
                    </div>
                    <div className="text-xs text-gray-400">Resolved</div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-red-400/50">
                  <CardContent className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-400" />
                      <span className="text-lg font-bold text-white">{stats.cancelled}</span>
                    </div>
                    <div className="text-xs text-gray-400">Cancelled</div>
                  </CardContent>
                </Card>

                <Card className="bg-black/50 border-yellow-400/50">
                  <CardContent className="py-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-yellow-400" />
                      <span className="text-lg font-bold text-white">{stats.avgResolution}m</span>
                    </div>
                    <div className="text-xs text-gray-400">Avg Resolution</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search & Filters */}
              <Card className="bg-black/50 border-cyan-400/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Q Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-black/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-black/50 border-gray-600 text-white">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-gray-600">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
                        <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
                        <SelectItem value="resolved" className="text-white hover:bg-gray-700">Resolved</SelectItem>
                        <SelectItem value="cancelled" className="text-white hover:bg-gray-700">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 text-white border-gray-400 hover:bg-white/20"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-4 h-96">
                
                {/* SOS Event History */}
                <Card className="bg-black/50 border-cyan-400/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-cyan-300 text-sm font-medium">
                      SOS Event History ({filteredEvents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-sm">No SOS events found</div>
                      </div>
                    ) : (
                      filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedEvent?.id === event.id
                              ? 'bg-cyan-500/20 border-cyan-400'
                              : 'bg-gray-500/10 border-gray-600 hover:bg-gray-500/20'
                          }`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">
                              {event.emergency_type.toUpperCase()}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                event.status === 'active' ? 'border-red-400 text-red-400' :
                                event.status === 'resolved' ? 'border-green-400 text-green-400' :
                                'border-gray-400 text-gray-400'
                              }`}
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-300 mt-1">
                            {event.description || 'No description'}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Event Details */}
                <Card className="bg-black/50 border-cyan-400/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-cyan-300 text-sm font-medium">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedEvent ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Emergency Type</div>
                          <div className="text-xs text-gray-300">{selectedEvent.emergency_type}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Status</div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              selectedEvent.status === 'active' ? 'border-red-400 text-red-400' :
                              selectedEvent.status === 'resolved' ? 'border-green-400 text-green-400' :
                              'border-gray-400 text-gray-400'
                            }`}
                          >
                            {selectedEvent.status}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Created</div>
                          <div className="text-xs text-gray-300">
                            {new Date(selectedEvent.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Description</div>
                          <div className="text-xs text-gray-300">
                            {selectedEvent.description || 'No description available'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white mb-1">Location</div>
                          <div className="text-xs text-gray-300">
                            {selectedEvent.latitude}, {selectedEvent.longitude}
                          </div>
                        </div>
                        {selectedEvent.user && (
                          <div>
                            <div className="text-sm font-medium text-white mb-1">User</div>
                            <div className="text-xs text-gray-300">{selectedEvent.user.name}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Eye className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-sm">Select an event to view details</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Historical Analytics */}
                <Card className="bg-black/50 border-cyan-400/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-cyan-300 text-sm font-medium">Historical Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-white mb-1">Most Common Emergency</div>
                      <div className="text-xs text-gray-300">{stats.mostCommonEmergency}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-1">Helpers Involved</div>
                      <div className="text-xs text-gray-300">{stats.helpersInvolved}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-1">Responders Involved</div>
                      <div className="text-xs text-gray-300">{stats.respondersInvolved}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white mb-1">Success Rate</div>
                      <div className="text-xs text-gray-300">{stats.successRate}%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 2 columns */}
          <div className="col-span-2 flex flex-col space-y-4 h-full">
            
            {/* USER & VICTIM DETAILS Panel */}
            <Card className="bg-black/50 border-cyan-400/50 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-sm font-medium">USER & VICTIM DETAILS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-500 flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTriangle className="w-4 h-4" />
                    {sosEvents.filter(e => e.status === 'active').length} Active
                  </div>
                  <div className="text-xs text-gray-400">Total SOS Events: {stats.totalEvents}</div>
                  <div className="text-xs text-gray-400">Critical Cases: {sosEvents.filter(e => String(e.priority) === '4').length}</div>
                </div>
              </CardContent>
            </Card>

            {/* LIVE SOS FEED Panel */}
            <Card className="bg-black/50 border-cyan-400/50 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-sm font-medium">LIVE SOS FEED</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-6 text-gray-500">
                  <div className="text-sm flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    {sosEvents.filter(e => e.status === 'active').length === 0 ? 'No SOS events.' : `${sosEvents.filter(e => e.status === 'active').length} active events`}
                  </div>
                </div>
                
                {/* Feed Statistics */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">FEED STATISTICS</div>
                    <div className="text-gray-500">Total Events Today: {stats.totalEvents}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SOSHistoryDashboard;
