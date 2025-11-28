import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl';
import { 
  AlertTriangle, 
  User, 
  Heart, 
  Shield, 
  Building2, 
  MapPin, 
  Filter, 
  RefreshCw, 
  Loader2,
  LogOut,
  Settings,
  Eye,
  EyeOff,
  Clock,
  Phone,
  Mail,
  Navigation,
  Play,
  Pause,
  Volume2,
  Wifi,
  Zap,
  Star,
  Users,
  Activity,
  Globe,
  Keyboard,
  Target,
  Layers,
  ChevronDown,
  Map,
  Ruler,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  authService, 
  sosEventService, 
  helperService, 
  responderService, 
  hospitalService,
  mediaService,
  type SOSEvent,
  type Helper,
  type Responder,
  type Hospital,
  type Media
} from '@/lib/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaHZtcCIsImEiOiJjbWN6MWk0OXQwdGM4MmtzMzZ4em5zNWFjIn0.bS5vNy8djudidIdQ6yYUdw';

interface AdminDashboardProps {
  className?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map state
  const [viewState, setViewState] = useState({
    longitude: 73.1812,
    latitude: 22.3072,
    zoom: 12
  });

  // Data state
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SOSEvent | null>(null);
  const [selectedEventMedia, setSelectedEventMedia] = useState<Media[]>([]);

  // Filter state
  const [showUsers, setShowUsers] = useState(true);
  const [showHelpers, setShowHelpers] = useState(true);
  const [showResponders, setShowResponders] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);

  // Route state
  const [routes, setRoutes] = useState<any[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Timeline state
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Live SOS Feed state
  const [liveFeedEvents, setLiveFeedEvents] = useState<any[]>([]);

  // Current time and date
  const [currentTime, setCurrentTime] = useState(new Date());

  // Map view state
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [mapLayersOpen, setMapLayersOpen] = useState(false);
  const [distanceControlsOpen, setDistanceControlsOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<'none' | 'distance' | 'area'>('none');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await authService.getCurrentUser();
        setUser(user);
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate live SOS feed events
  useEffect(() => {
    const eventTypes = [
      { type: 'SECURITY', color: 'text-red-400' },
      { type: 'MEDICAL', color: 'text-blue-400' },
      { type: 'FIRE', color: 'text-orange-400' },
      { type: 'SYSTEM', color: 'text-purple-400' },
    ];
    
    const locations = ['Sub-level 3', 'North Bridge', 'Sector 4', 'Downtown', 'Power Plant'];
    
    const generateEvent = () => {
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      return {
        id: Date.now() + Math.random(),
        ...event,
        location,
        timestamp: new Date().toLocaleTimeString(),
      };
    };

    setLiveFeedEvents(Array.from({ length: 5 }, generateEvent));
    const interval = setInterval(() => {
      setLiveFeedEvents(prev => [generateEvent(), ...prev.slice(0, 4)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [events, helpersData, respondersData, hospitalsData] = await Promise.all([
          sosEventService.getActiveSOSEvents(),
          helperService.getAvailableHelpers(),
          responderService.getAvailableResponders(),
          hospitalService.getHospitals()
        ]);

        setSosEvents(events);
        setHelpers(helpersData);
        setResponders(respondersData);
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const subscriptions = [
      sosEventService.subscribeToSOSEvents((payload) => {
        if (payload.eventType === 'INSERT') {
          setSosEvents(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setSosEvents(prev => prev.map(event => 
            event.id === payload.new.id ? payload.new : event
          ));
        } else if (payload.eventType === 'DELETE') {
          setSosEvents(prev => prev.filter(event => event.id !== payload.old.id));
        }
      }),

      helperService.subscribeToHelpers((payload) => {
        if (payload.eventType === 'INSERT') {
          setHelpers(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setHelpers(prev => prev.map(helper => 
            helper.id === payload.new.id ? payload.new : helper
          ));
        } else if (payload.eventType === 'DELETE') {
          setHelpers(prev => prev.filter(helper => helper.id !== payload.old.id));
        }
      }),

      responderService.subscribeToResponders((payload) => {
        if (payload.eventType === 'INSERT') {
          setResponders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setResponders(prev => prev.map(responder => 
            responder.id === payload.new.id ? payload.new : responder
          ));
        } else if (payload.eventType === 'DELETE') {
          setResponders(prev => prev.filter(responder => responder.id !== payload.old.id));
        }
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [isAuthenticated]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Calculate route between two points
  const calculateRoute = useCallback(async (from: [number, number], to: [number, number]) => {
    setIsCalculatingRoute(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = (route.distance / 1000).toFixed(1); // km
        const duration = Math.round(route.duration / 60); // minutes
        
        setRoutes(prev => [...prev, {
          id: `${from[0]}-${from[1]}-${to[0]}-${to[1]}`,
          geometry: route.geometry,
          distance,
          duration
        }]);
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, []);

  // Handle SOS event selection
  const handleEventSelect = async (event: SOSEvent) => {
    setSelectedEvent(event);
    
    // Fetch media for this event
    try {
      const media = await mediaService.getMediaForSOSEvent(event.id);
      setSelectedEventMedia(media);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setSelectedEventMedia([]);
    }

    // Calculate route if there's an assigned helper
    if (event.assigned_helper_id) {
      const helper = helpers.find(h => h.id === event.assigned_helper_id);
      if (helper) {
        calculateRoute(
          [helper.longitude, helper.latitude],
          [event.longitude, event.latitude]
        );
      }
    }
  };

  // Get marker color based on type
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'sos': return '#ef4444'; // Red
      case 'helper': return '#3b82f6'; // Blue
      case 'responder': return '#22c55e'; // Green
      case 'hospital': return '#eab308'; // Yellow
      default: return '#6b7280'; // Gray
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'assigned': return 'secondary';
      case 'resolved': return 'default';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  // Handle map style changes
  const handleMapStyleChange = (style: string) => {
    setMapStyle(style);
    if (style.includes('satellite')) {
      setShowSatellite(true);
      setShowTraffic(false);
    } else if (style.includes('streets')) {
      setShowSatellite(false);
      setShowTraffic(true);
    } else {
      setShowSatellite(false);
      setShowTraffic(false);
    }
  };

  // Toggle traffic layer
  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
  };

  // Handle measurement mode
  const handleMeasurementMode = (mode: 'none' | 'distance' | 'area') => {
    setMeasurementMode(mode);
    setDistanceControlsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Admin Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Please sign in to access the admin dashboard.
            </p>
            <Button className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-cyan-400">Advance SOS Max</h1>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>STATUS: <span className="text-green-400 font-bold">OPERATIONAL</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>POWER: <span className="text-green-400 font-bold">STABLE</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>SECURITY: <span className="text-green-400 font-bold">SECURE</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <div>{currentTime.toLocaleTimeString()}</div>
                <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
                {/* Left Column - Helpers & Responders + Command & Control */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
          {/* Helpers & Responders Section */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white mb-3 sticky top-0 bg-gray-800 py-1">HELPERS & RESPONDERS</h2>
              
              {/* Unknown Location Card */}
              <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 mb-3">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white" />
                      <span className="text-white font-medium">Unknown Location</span>
                    </div>
                    <div className="text-white text-xs">22.3872, 73.1812</div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Responders Card */}
              <Card className="bg-blue-900 border-blue-700 mb-3">
                <CardContent className="p-2">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">Active Responders</div>
                      <div className="text-2xl font-bold text-blue-400">{helpers.length + responders.length}</div>
                      <div className="text-gray-400 text-xs">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Nearby Responders */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Nearby Responders
                </h4>
                
                {helpers.slice(0, 2).map((helper) => (
                  <Card key={helper.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {helper.name?.split(' ').map((n: string) => n[0]).join('') || 'H'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <h5 className="text-xs font-medium text-white">{helper.name || 'Helper'}</h5>
                            <Star className="w-2 h-2 text-yellow-400 fill-current" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Available
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <MapPin className="w-2 h-2" />
                        <span>Address not found</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Command & Control Section */}
          <div className="border-t border-gray-700 p-3 overflow-y-auto max-h-48">
            <h2 className="text-base font-semibold text-white mb-3 sticky top-0 bg-gray-800 py-1">COMMAND & CONTROL</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs">
                <Keyboard className="w-3 h-3 mr-2" />
                AI Command
              </Button>
              <Button variant="outline" className="w-full justify-start bg-blue-600 border-blue-500 text-white hover:bg-blue-700 text-xs">
                <MapPin className="w-3 h-3 mr-2" />
                Map Overlays
              </Button>
              <Button variant="outline" className="w-full justify-start bg-gray-700 border-gray-600 text-white hover:bg-gray-600 text-xs">
                <Globe className="w-3 h-3 mr-2" />
                Global View
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Geo-Spatial View */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <h2 className="text-lg font-semibold text-white bg-gray-800/80 px-3 py-1 rounded">
              GEO-SPATIAL VIEW
            </h2>
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 max-w-[calc(100%-2rem)] overflow-x-auto">
            {/* Map Layers Dropdown */}
            <DropdownMenu open={mapLayersOpen} onOpenChange={setMapLayersOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Map Layers
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-600">
                <DropdownMenuLabel className="text-white">Map Style</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${mapStyle.includes('dark') ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMapStyleChange('mapbox://styles/mapbox/dark-v11')}
                >
                  <span className="mr-2">🌙</span>
                  Dark Mode
                  {mapStyle.includes('dark') && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${mapStyle.includes('light') ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMapStyleChange('mapbox://styles/mapbox/light-v11')}
                >
                  <span className="mr-2">☀️</span>
                  Light Mode
                  {mapStyle.includes('light') && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${mapStyle.includes('satellite') ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMapStyleChange('mapbox://styles/mapbox/satellite-v9')}
                >
                  <span className="mr-2">🛰️</span>
                  Satellite View
                  {mapStyle.includes('satellite') && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${mapStyle.includes('streets') ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMapStyleChange('mapbox://styles/mapbox/streets-v12')}
                >
                  <span className="mr-2">🛣️</span>
                  Streets View
                  {mapStyle.includes('streets') && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-600" />
                <DropdownMenuLabel className="text-white">Overlays</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${showTraffic ? 'bg-green-600/20' : ''}`}
                  onClick={toggleTraffic}
                >
                  <span className="mr-2">🚗</span>
                  Traffic Layer
                  {showTraffic && <span className="ml-auto text-green-400">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Distance/Measurement Controls */}
            <DropdownMenu open={distanceControlsOpen} onOpenChange={setDistanceControlsOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`bg-gray-800/90 border-gray-600 text-white hover:bg-gray-700/90 ${measurementMode !== 'none' ? 'bg-blue-600/20 border-blue-500' : ''}`}
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Distance
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-gray-800 border-gray-600">
                <DropdownMenuLabel className="text-white">Measurement Tools</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${measurementMode === 'distance' ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMeasurementMode('distance')}
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Measure Distance
                  {measurementMode === 'distance' && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={`text-white hover:bg-gray-700 ${measurementMode === 'area' ? 'bg-blue-600/20' : ''}`}
                  onClick={() => handleMeasurementMode('area')}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Measure Area
                  {measurementMode === 'area' && <span className="ml-auto text-blue-400">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-600" />
                
                <DropdownMenuItem 
                  className="text-white hover:bg-gray-700"
                  onClick={() => handleMeasurementMode('none')}
                >
                  <span className="mr-2">✕</span>
                  Clear Measurements
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Current Map Style Indicator */}
            <div className="bg-gray-800/90 px-3 py-2 rounded text-white text-sm flex items-center gap-2">
              {mapStyle.includes('satellite') && <span>🛰️</span>}
              {mapStyle.includes('dark') && <span>🌙</span>}
              {mapStyle.includes('light') && <span>☀️</span>}
              {mapStyle.includes('streets') && <span>🛣️</span>}
              {showTraffic && <span>🚗</span>}
              <span className="font-medium">
                {mapStyle.includes('satellite') ? 'Satellite' : 
                 mapStyle.includes('dark') ? 'Dark' : 
                 mapStyle.includes('light') ? 'Light' : 
                 mapStyle.includes('streets') ? 'Streets' : 'Map'}
                {showTraffic && ' + Traffic'}
              </span>
            </div>
          </div>
          
                      <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              scrollZoom={true}
              dragPan={true}
              dragRotate={true}
              keyboard={true}
            >
            <NavigationControl position="top-right" />

            {/* Traffic Layer */}
            {showTraffic && (
              <Source id="traffic" type="vector" url="mapbox://mapbox.mapbox-traffic-v1">
                <Layer
                  id="traffic-layer"
                  type="line"
                  source-layer="traffic"
                  paint={{
                    'line-color': [
                      'case',
                      ['==', ['get', 'congestion'], 'low'], '#00ff00',
                      ['==', ['get', 'congestion'], 'moderate'], '#ffff00',
                      ['==', ['get', 'congestion'], 'heavy'], '#ff0000',
                      ['==', ['get', 'congestion'], 'severe'], '#ff0000',
                      '#00ff00'
                    ],
                    'line-width': 2,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}

            {/* SOS Event Markers */}
            {showUsers && sosEvents.map((event) => (
              <Marker
                key={`sos-${event.id}`}
                longitude={event.longitude}
                latitude={event.latitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleEventSelect(event);
                }}
              >
                <div className="cursor-pointer">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: getMarkerColor('sos') }}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Marker>
            ))}

            {/* Helper Markers */}
            {showHelpers && helpers.map((helper) => (
              <Marker
                key={`helper-${helper.id}`}
                longitude={helper.longitude}
                latitude={helper.latitude}
                anchor="bottom"
              >
                <div className="cursor-pointer">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: getMarkerColor('helper') }}
                  >
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                </div>
              </Marker>
            ))}

            {/* Responder Markers */}
            {showResponders && responders.map((responder) => (
              <Marker
                key={`responder-${responder.id}`}
                longitude={responder.longitude}
                latitude={responder.latitude}
                anchor="bottom"
              >
                <div className="cursor-pointer">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: getMarkerColor('responder') }}
                  >
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>
              </Marker>
            ))}

            {/* Hospital Markers */}
            {showHospitals && hospitals.map((hospital) => (
              <Marker
                key={`hospital-${hospital.id}`}
                longitude={hospital.longitude}
                latitude={hospital.latitude}
                anchor="bottom"
              >
                <div className="cursor-pointer">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: getMarkerColor('hospital') }}
                  >
                    <Building2 className="w-3 h-3 text-white" />
                  </div>
                </div>
              </Marker>
            ))}

            {/* Route Lines */}
            {routes.map((route) => (
              <Source key={route.id} type="geojson" data={route.geometry}>
                <Layer
                  id={route.id}
                  type="line"
                  paint={{
                    'line-color': '#3b82f6',
                    'line-width': 3,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            ))}

            {/* Selected Event Popup */}
            {selectedEvent && (
              <Popup
                longitude={selectedEvent.longitude}
                latitude={selectedEvent.latitude}
                anchor="bottom"
                onClose={() => setSelectedEvent(null)}
                className="z-10"
                maxWidth="300px"
              >
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-gray-900">
                      {selectedEvent.emergency_type.toUpperCase()} Emergency
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      {selectedEvent.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(selectedEvent.status)}>
                        {selectedEvent.status}
                      </Badge>
                      <span className="text-gray-500">
                        {new Date(selectedEvent.created_at!).toLocaleString()}
                      </span>
                    </div>

                    {selectedEvent.assigned_helper_id && (
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-blue-800 text-xs">
                          Assigned to Helper: {selectedEvent.assigned_helper_id}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Navigation className="w-3 h-3 mr-1" />
                        Route
                      </Button>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        {/* Right Column - User & Victim Details + Live SOS Feed */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col h-full overflow-hidden">
          {/* User & Victim Details Section */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white mb-3 sticky top-0 bg-gray-800 py-1">USER & VICTIM DETAILS</h2>
              
              {/* Active Victims Card */}
              <Card className="bg-blue-900 border-blue-700 mb-3">
                <CardContent className="p-2">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-white font-medium">Active Victims</div>
                      <div className="text-2xl font-bold text-red-400">{sosEvents.length}</div>
                      <div className="text-gray-400 text-xs">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Cases */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-300 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Emergency Cases
                </h4>
                
                {sosEvents.slice(0, 2).map((event) => (
                  <Card key={event.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {event.emergency_type?.charAt(0) || 'E'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <h5 className="text-xs font-medium text-white">
                            {event.emergency_type || 'Emergency'}
                            </h5>
                            <span className="text-xs text-gray-400">(-- yrs)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              Critical
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <MapPin className="w-2 h-2" />
                        <span>Address not found</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                        <Clock className="w-2 h-2" />
                        <span>ETA: --</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-400 text-xs mt-1">
                        Elevation: --
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs h-6">
                          <Phone className="w-2 h-2 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600 text-xs h-6">
                          <Target className="w-2 h-2 mr-1" />
                          Track
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Live SOS Feed Section */}
          <div className="border-t border-gray-700 p-3 overflow-y-auto max-h-48">
            <h2 className="text-base font-semibold text-white mb-3 sticky top-0 bg-gray-800 py-1">LIVE SOS FEED</h2>
            <div className="space-y-2">
              {liveFeedEvents.map((event) => (
                <div key={event.id} className="flex justify-between items-center py-2 border-b border-gray-600 text-sm">
                  <span className={`font-bold ${event.color}`}>{`[${event.type}]`}</span>
                  <span className="text-gray-300">{event.location}</span>
                  <span className="text-gray-400">{event.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 