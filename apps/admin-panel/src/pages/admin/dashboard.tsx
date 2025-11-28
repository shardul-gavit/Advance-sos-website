import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EnhancedAdminMap } from '@/components/map/EnhancedAdminMap';
import { EncryptionPanel } from '@/components/admin/EncryptionPanel';
import { SmartPowerMode } from '@/components/admin/SmartPowerMode';
import RealtimeSOSDashboard from '@/components/admin/RealtimeSOSDashboard';
import HLSPlayerDashboard from '@/components/admin/HLSPlayerDashboard';
import SOSHistoryDashboard from '@/components/admin/SOSHistoryDashboard';
import SOSReportDashboard from '@/components/admin/SOSReportDashboard';
import { APIService } from '@/lib/services/api';
import { RealtimeService } from '@/lib/services/realtime';
import { SOSDataService, testDataAccess } from '@/lib/services/sosDataService';
import { orchestratorService } from '@/lib/services/orchestratorService';
import { supabase } from '@/lib/supabase';
import { SOSEvent, Helper, Responder, Hospital, MapMarker } from '@/types/sos';
import { MapFilters } from '@/types/map';
import { formatRelativeTime, getEmergencyTypeColor, getStatusColor } from '@/lib/utils';
import { MAPBOX_CONFIG } from '@/lib/mapbox';
import { useLocation } from '@/contexts/LocationContext';
import { 
  MapPin, 
  Users, 
  User, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Star, 
  Shield, 
  Zap, 
  Settings, 
  Database, 
  Bell,
  Battery,
  Lock,
  X,
  Radio,
  MessageSquare,
  Eye,
  FileText,
  Monitor,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Search,
  Navigation
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type MapFocusOptions = {
  persist?: boolean;
  sosId?: string;
  label?: string;
};

const AdminDashboard: React.FC = () => {
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [customMarkers, setCustomMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [selectedSOSEvent, setSelectedSOSEvent] = useState<SOSEvent | null>(null);
  const [mapFilters, setMapFilters] = useState<MapFilters>({
    showSOS: true,
    showHelpers: true,
    showResponders: true,
    showHospitals: true,
    showUsers: false,
    showRoutes: true,
    showClusters: true,
    showHeatmap: false,
    showMarkers: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Location context - safely get location data
  let userLocation: any = null;
  let isLocationLoading = false;
  let locationError: string | null = null;
  let refreshLocation: (() => Promise<void>) | null = null;
  
  try {
    const locationContext = useLocation();
    userLocation = locationContext.userLocation;
    isLocationLoading = locationContext.isLoading;
    locationError = locationContext.error;
    refreshLocation = locationContext.refreshLocation;
  } catch (error) {
    // Location context might fail, but don't crash the app
    console.warn('Location context error (non-critical):', error);
  }
  const [stats, setStats] = useState({
    activeSOS: 0,
    totalHelpers: 0,
    availableHelpers: 0,
    totalResponders: 0,
    availableResponders: 0,
  });

  const [isSystemStatusOpen, setIsSystemStatusOpen] = useState(false);
  const [isMapPanelsOpen, setIsMapPanelsOpen] = useState(false);
  const [mapRef, setMapRef] = useState<any>(null);
  const [geoSweepRadius, setGeoSweepRadius] = useState(5000);
  const [selectedZoneType, setSelectedZoneType] = useState('circle');
  const [mapStyle, setMapStyle] = useState('satellite');
  // Remove showGeolocationMarker state - marker will always be visible when location is available
  
  // Feature states
  const [activeTab, setActiveTab] = useState('overview');
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [showPowerModeModal, setShowPowerModeModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    frontend: 'connected',
    backend: 'connected',
    orchestrator: 'unknown'
  });
  const [newSOSNotification, setNewSOSNotification] = useState<{
    show: boolean;
    event: any;
  }>({ show: false, event: null });
  const [autoSOSFinderActive, setAutoSOSFinderActive] = useState(true);
  const [detectedSOSCount, setDetectedSOSCount] = useState(0);
  const [processedSOSIds, setProcessedSOSIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedEventForStream, setSelectedEventForStream] = useState<SOSEvent | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [focusedCoordinates, setFocusedCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [trackedSOSAlertId, setTrackedSOSAlertId] = useState<string | null>(null);
  const [trackedSOSMarkerId, setTrackedSOSMarkerId] = useState<string | null>(null);

  const addCustomMarker = (marker: MapMarker) => {
    setCustomMarkers(prev => {
      const filtered = prev.filter(m => m.id !== marker.id);
      return [marker, ...filtered];
    });
  };

  const removeCustomMarker = (markerId: string) => {
    setCustomMarkers(prev => prev.filter(m => m.id !== markerId));
  };

  // Map control states
  const [activeMapView, setActiveMapView] = useState<'sos' | 'location' | 'supabase'>('sos');
  const [mapViewConfig, setMapViewConfig] = useState({
    sos: { showMarkers: true, showClusters: true, showRoutes: true },
    location: { showMarkers: true, showClusters: false, showRoutes: false },
    supabase: { showMarkers: true, showClusters: false, showRoutes: false }
  });

  // Trigger map resize when overlay state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, [isMapPanelsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is outside the system status dropdown
      const systemStatusDropdown = document.querySelector('.system-status-dropdown');
      if (systemStatusDropdown && !systemStatusDropdown.contains(target)) {
        setIsSystemStatusOpen(false);
      }
    };

    // Use mousedown instead of click for better responsiveness
    document.addEventListener('mousedown', handleClickOutside);
    
    // Also close on escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSystemStatusOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Load initial data with comprehensive SOS data service
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 Loading initial data with SOS Data Service...');
        
        // Test orchestrator connection first
        console.log('🔗 Testing orchestrator connection...');
        try {
          const orchestratorTest = await orchestratorService.testConnection();
          setConnectionStatus(prev => ({
            ...prev,
            orchestrator: orchestratorTest.success ? 'connected' : 'disconnected'
          }));
          console.log('🎯 Orchestrator test result:', orchestratorTest);
          
          if (orchestratorTest.success) {
            console.log('✅ Orchestrator connection established successfully');
          } else {
            console.warn('⚠️ Orchestrator connection failed:', orchestratorTest.error);
          }
        } catch (error) {
          console.error('❌ Orchestrator connection test error:', error);
          setConnectionStatus(prev => ({
            ...prev,
            orchestrator: 'disconnected'
          }));
        }
        
        // Test data access first
        const testResult = await testDataAccess();
        console.log('🧪 Data access test result:', testResult);
        
        // Load SOS events using the new service
        const sosAlerts = await SOSDataService.fetchAllSOSAlerts();
        console.log(`📊 Loaded ${sosAlerts.length} SOS alerts`);
        
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
        
        // Load other data using existing API service
        const [helpersRes, respondersRes, hospitalsRes] = await Promise.all([
          APIService.getHelpers(),
          APIService.getResponders(),
          APIService.getHospitals(),
        ]);

        if (!helpersRes.error) setHelpers(helpersRes.helpers);
        if (!respondersRes.error) setResponders(respondersRes.responders);
        if (!hospitalsRes.error) setHospitals(hospitalsRes.hospitals);

        updateStats(convertedEvents, helpersRes.helpers, respondersRes.responders);
        console.log('✅ Initial data loading completed successfully');
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    const realtimeService = new RealtimeService();

    realtimeService.subscribeToAll({
      onSOSEvent: (payload) => {
        console.log('SOS Event update:', payload);
        setSosEvents(prev => {
          const index = prev.findIndex(e => e.id === payload.new.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = payload.new;
            return updated;
          } else {
            return [payload.new, ...prev];
          }
        });
      },
      onHelper: (payload) => {
        console.log('Helper update:', payload);
        setHelpers(prev => {
          const index = prev.findIndex(h => h.id === payload.new.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = payload.new;
            return updated;
          } else {
            return [...prev, payload.new];
          }
        });
      },
      onResponder: (payload) => {
        console.log('Responder update:', payload);
        setResponders(prev => {
          const index = prev.findIndex(r => r.id === payload.new.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = payload.new;
            return updated;
          } else {
            return [...prev, payload.new];
          }
        });
      }
    });

    return () => {
      realtimeService.unsubscribe();
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const newMarkers: MapMarker[] = [];

    // Add SOS event markers
    sosEvents.forEach(event => {
      newMarkers.push({
        id: `sos-${event.id}`,
        type: 'sos',
        latitude: event.latitude,
        longitude: event.longitude,
        data: event,
        popup: {
          title: `SOS Event - ${event.emergency_type.toUpperCase()}`,
          content: `
            <div class="space-y-2">
              <p><strong>Status:</strong> <span class="${getStatusColor(event.status)}">${event.status}</span></p>
              <p><strong>Priority:</strong> ${event.priority}</p>
              <p><strong>Description:</strong> ${event.description || 'No description'}</p>
              <p><strong>Created:</strong> ${formatRelativeTime(event.created_at)}</p>
              ${event.user ? `<p><strong>User:</strong> ${event.user.name}</p>` : ''}
            </div>
          `,
          actions: [
            {
              label: 'View Details',
              action: () => {
                setSelectedSOSEvent(event);
              },
              variant: 'primary',
            },
            {
              label: 'Assign Helper',
              action: () => console.log('Assign helper to:', event.id),
              variant: 'secondary',
            },
          ],
        },
      });
    });

    // Add helper markers
    helpers.forEach(helper => {
      // Safely access properties that might not exist in users table
      const emergencyTypes = Array.isArray(helper.emergency_types) 
        ? helper.emergency_types.join(', ') 
        : (helper.emergency_types || 'N/A');
      const rating = helper.rating ?? 'N/A';
      const totalHelps = helper.total_helps ?? 0;
      const status = helper.status || 'unknown';
      const phone = helper.phone || 'N/A';
      const name = helper.name || 'Unknown Helper';
      
      newMarkers.push({
        id: `helper-${helper.id}`,
        type: 'helper',
        latitude: helper.latitude || 0,
        longitude: helper.longitude || 0,
        data: helper,
        popup: {
          title: `Helper - ${name}`,
          content: `
            <div class="space-y-2">
              <p><strong>Status:</strong> <span class="${getStatusColor(status)}">${status}</span></p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Rating:</strong> ${rating}/5.0</p>
              <p><strong>Total Helps:</strong> ${totalHelps}</p>
              <p><strong>Emergency Types:</strong> ${emergencyTypes}</p>
            </div>
          `,
          actions: [
            {
              label: 'View Profile',
              action: () => console.log('View helper profile:', helper.id),
              variant: 'primary',
            },
            {
              label: 'Contact',
              action: () => console.log('Contact helper:', phone),
              variant: 'secondary',
            },
          ],
        },
      });
    });

    // Add responder markers
    responders.forEach(responder => {
      // Safely access properties that might not exist in users table
      const emergencyTypes = Array.isArray(responder.emergency_types) 
        ? responder.emergency_types.join(', ') 
        : (responder.emergency_types || 'N/A');
      const organization = responder.organization || 'N/A';
      const department = responder.department || 'N/A';
      const status = responder.status || 'unknown';
      const phone = responder.phone || 'N/A';
      const name = responder.name || 'Unknown Responder';
      
      newMarkers.push({
        id: `responder-${responder.id}`,
        type: 'responder',
        latitude: responder.latitude || 0,
        longitude: responder.longitude || 0,
        data: responder,
        popup: {
          title: `Responder - ${name}`,
          content: `
            <div class="space-y-2">
              <p><strong>Organization:</strong> ${organization}</p>
              <p><strong>Department:</strong> ${department}</p>
              <p><strong>Status:</strong> <span class="${getStatusColor(status)}">${status}</span></p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Emergency Types:</strong> ${emergencyTypes}</p>
            </div>
          `,
          actions: [
            {
              label: 'View Profile',
              action: () => console.log('View responder profile:', responder.id),
              variant: 'primary',
            },
            {
              label: 'Contact',
              action: () => console.log('Contact responder:', phone),
              variant: 'secondary',
            },
          ],
        },
      });
    });

    setMarkers([...customMarkers, ...newMarkers]);
  }, [sosEvents, helpers, responders, customMarkers]);

  const updateStats = (events: SOSEvent[], helpers: Helper[], responders: Responder[]) => {
    setStats({
      activeSOS: events.filter(e => e?.status === 'active').length,
      totalHelpers: helpers.length,
      availableHelpers: helpers.filter(h => h?.status === 'available').length,
      totalResponders: responders.length,
      availableResponders: responders.filter(r => r?.status === 'available').length,
    });
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    if (marker.type === 'sos') {
      setSelectedSOSEvent(marker.data as SOSEvent);
    }
  };


  // Map Control Functions
  const handleGeoSweepRadiusChange = (value: number) => {
    setGeoSweepRadius(value);
    // Here you would trigger the actual geosweep functionality
    console.log('GeoSweep radius changed to:', value);
  };

  const handleClearSweeps = () => {
    // Clear all geosweeps
    console.log('Clearing all sweeps');
  };

  const handleZoneTypeChange = (type: string) => {
    setSelectedZoneType(type);
    console.log('Zone type changed to:', type);
  };

  const handleClearRoutes = () => {
    // Clear all routes
    console.log('Clearing all routes');
  };

  const handleCreateIsochrone = () => {
    // Create isochrone
    console.log('Creating isochrone');
  };

  const handleClearIsochrones = () => {
    // Clear all isochrones
    console.log('Clearing all isochrones');
  };

  const handleMapStyleChange = (style: string) => {
    setMapStyle(style);
    // Here you would change the actual map style
    console.log('Map style changed to:', style);
  };

  const handleZoomIn = () => {
    if (mapRef) {
      mapRef.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef) {
      mapRef.zoomOut();
    }
  };

  const handleFitAll = () => {
    if (mapRef) {
      // Fit all markers in view
      console.log('Fitting all markers in view');
    }
  };

  const handleCenter = () => {
    if (mapRef) {
      mapRef.flyTo({ center: MAPBOX_CONFIG.center, zoom: MAPBOX_CONFIG.zoom });
      console.log('Centering map');
    }
  };

  // Handle map focus for SOS triggers
  const handleMapFocus = (latitude: number, longitude: number, options?: MapFocusOptions) => {
    // Switch to geo-spatial view (overview tab)
    setActiveTab('overview');
    
    // Set focused coordinates
    setFocusedCoordinates({ lat: latitude, lng: longitude });
    
    // Focus map on the coordinates
    if (mapRef) {
      mapRef.flyTo({ 
        center: [longitude, latitude], 
        zoom: 15,
        duration: 2000
      });
      console.log(`🗺️ Focusing map on SOS location: ${latitude}, ${longitude}`);
    }
    
    const markerId = options?.persist && options?.sosId ? `tracked-sos-${options.sosId}` : `focus-${Date.now()}`;
    const markerLabel = options?.label || 'Focused Location';

    const focusMarker: MapMarker = {
      id: markerId,
      type: 'sos',
      latitude,
      longitude,
      data: {
        id: markerId,
        name: markerLabel,
        address: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      } as any,
      popup: {
        title: markerLabel,
        content: `
          <div class="space-y-2">
            <p><strong>Latitude:</strong> ${latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${longitude.toFixed(6)}</p>
            ${options?.persist ? '<p><strong>Tracking:</strong> Active until alert resolves</p>' : ''}
          </div>
        `,
      },
    };

    addCustomMarker(focusMarker);

    if (options?.persist && options?.sosId) {
      setTrackedSOSAlertId(options.sosId);
      setTrackedSOSMarkerId(markerId);
    } else {
    setTimeout(() => {
        removeCustomMarker(markerId);
    }, 15000);
    
    setTimeout(() => {
      setFocusedCoordinates(null);
    }, 15000);
    
    setTimeout(() => {
      alert(`📍 Location Focused\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\nZoom Level: 15\n\nA temporary marker has been added to the map.`);
    }, 1000);
    }
  };

  // Handle new SOS trigger
  const handleSOSTrigger = (sosEvent: any) => {
    console.log('🚨 New SOS trigger received in dashboard:', sosEvent);
    
    // Show notification
    setNewSOSNotification({
      show: true,
      event: sosEvent
    });
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNewSOSNotification(prev => ({ ...prev, show: false }));
    }, 5000);
    
    // Add to current events if not already present
    setSosEvents(prev => {
      const exists = prev.find(e => e.id === sosEvent.id);
      if (!exists) {
        return [sosEvent, ...prev];
      }
      return prev;
    });
  };

  // Remove tracked marker once alert is resolved or cancelled
  useEffect(() => {
    if (!trackedSOSAlertId) return;

    const trackedEvent = sosEvents.find(event => event.id === trackedSOSAlertId);
    if (!trackedEvent) return;

    const isClosed = trackedEvent.status === 'resolved' || trackedEvent.status === 'cancelled';
    if (isClosed) {
      if (trackedSOSMarkerId) {
        removeCustomMarker(trackedSOSMarkerId);
      }
      setTrackedSOSAlertId(null);
      setTrackedSOSMarkerId(null);
      setFocusedCoordinates(null);
    }
  }, [sosEvents, trackedSOSAlertId, trackedSOSMarkerId]);

  // Auto detect and reflect SOS triggers on map
  useEffect(() => {
    if (!autoSOSFinderActive) return;

    const detectSOSTriggers = () => {
      // Check for new SOS events that haven't been processed yet
      sosEvents.forEach(event => {
        if (
          event.status === 'active' && 
          event.latitude && 
          event.longitude &&
          !processedSOSIds.has(event.id)
        ) {
          // Focus map on new SOS location with animation
          handleMapFocus(event.latitude, event.longitude);
          
          // Show notification for new SOS detection
          setNewSOSNotification({
            show: true,
            event: {
              ...event,
              emergencyType: event.emergency_type || 'Emergency',
              userName: event.user_id || 'Unknown User',
              priority: event.priority || 'medium'
            }
          });
          
          // Auto-hide notification after 8 seconds for SOS finder
          setTimeout(() => {
            setNewSOSNotification(prev => ({ ...prev, show: false }));
          }, 8000);
          
          // Update detected count
          setDetectedSOSCount(prev => prev + 1);
          
          // Mark as processed
          setProcessedSOSIds(prev => new Set([...prev, event.id]));
          
          console.log(`🔍 Auto SOS Finder detected: ${event.emergency_type} at ${event.latitude}, ${event.longitude}`);
        }
      });
    };

    // Run detection every 500ms for faster response
    const interval = setInterval(detectSOSTriggers, 500);
    
    return () => clearInterval(interval);
  }, [autoSOSFinderActive, sosEvents, handleMapFocus, processedSOSIds]);

  // Reset processed SOS IDs when SOS events change significantly
  useEffect(() => {
    if (sosEvents.length === 0) {
      setProcessedSOSIds(new Set());
      setDetectedSOSCount(0);
    }
  }, [sosEvents.length]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  // Real-time subscriptions for SOS alerts and media
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions...');
    
    // Subscribe to sos_alerts changes
    const alertsSubscription = supabase
      .channel('sos_alerts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sos_alerts' 
        }, 
        (payload) => {
          console.log('📡 SOS Alert change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new alert to the list
            setSosEvents(prev => [payload.new as SOSEvent, ...prev]);
            console.log('✅ New SOS alert added to dashboard');
          } else if (payload.eventType === 'UPDATE') {
            // Update existing alert
            setSosEvents(prev => 
              prev.map(alert => 
                alert.id === payload.new.id ? { ...alert, ...payload.new } : alert
              )
            );
            console.log('✅ SOS alert updated in dashboard');
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted alert
            setSosEvents(prev => 
              prev.filter(alert => alert.id !== payload.old.id)
            );
            console.log('✅ SOS alert removed from dashboard');
          }
        }
      )
      .subscribe();

    // Subscribe to sos_media changes
    const mediaSubscription = supabase
      .channel('sos_media_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sos_media' 
        }, 
        (payload) => {
          console.log('📡 SOS Media change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add media to the corresponding alert
            setSosEvents(prev => 
              prev.map(alert => {
                if (alert.id === payload.new.sos_alert_id) {
                  const updatedMedia = [...(alert.media || []), payload.new];
                  return {
                    ...alert,
                    media: updatedMedia,
                    hasMedia: true,
                    mediaCount: updatedMedia.length
                  };
                }
                return alert;
              })
            );
            console.log('✅ New media added to SOS alert');
          } else if (payload.eventType === 'UPDATE') {
            // Update media in the corresponding alert
            setSosEvents(prev => 
              prev.map(alert => {
                if (alert.id === payload.new.sos_alert_id) {
                  const updatedMedia = (alert.media || []).map(media => 
                    media.id === payload.new.id ? payload.new : media
                  );
                  return {
                    ...alert,
                    media: updatedMedia
                  };
                }
                return alert;
              })
            );
            console.log('✅ Media updated in SOS alert');
          } else if (payload.eventType === 'DELETE') {
            // Remove media from the corresponding alert
            setSosEvents(prev => 
              prev.map(alert => {
                if (alert.id === payload.old.sos_alert_id) {
                  const updatedMedia = (alert.media || []).filter(media => 
                    media.id !== payload.old.id
                  );
                  return {
                    ...alert,
                    media: updatedMedia,
                    hasMedia: updatedMedia.length > 0,
                    mediaCount: updatedMedia.length
                  };
                }
                return alert;
              })
            );
            console.log('✅ Media removed from SOS alert');
          }
        }
      )
      .subscribe();

    console.log('✅ Real-time subscriptions established');

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions...');
      alertsSubscription.unsubscribe();
      mediaSubscription.unsubscribe();
      console.log('✅ Real-time subscriptions cleaned up');
    };
  }, []);

  // Map view handlers
  const handleMapViewChange = (view: 'sos' | 'location' | 'supabase') => {
    setActiveMapView(view);
    
    // Update map filters based on view
    const config = mapViewConfig[view];
    setMapFilters(prev => ({
      ...prev,
      showClusters: config.showClusters,
      showRoutes: config.showRoutes,
      showHeatmap: view === 'sos'
    }));
    
    console.log(`Switched to ${view.toUpperCase()} view`);
  };

  const handleSOSMapView = () => handleMapViewChange('sos');
  // Location Manager and Supabase Map handlers removed as buttons are hidden
  // const handleLocationManagerView = () => handleMapViewChange('location');
  // const handleSupabaseMapView = () => handleMapViewChange('supabase');

  // New button handlers
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleConnectionMode = () => {
    setShowConnectionModal(true);
  };

  const handleManualOverride = () => {
    setIsManualOverride(!isManualOverride);
  };

  // Search location handler - using real geocoding
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      console.log('🔍 Searching for location:', searchQuery);
      
      // Use Mapbox Geocoding API for real location search
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=IN&limit=5`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }
      
      const data = await response.json();
      const results = data.features.map((feature: any, index: number) => ({
        id: `${index}`,
        name: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
        address: feature.place_name,
        type: 'location'
      }));
      
      setSearchResults(results);
      setShowSearchResults(true);
      
      // Focus map on first result
      if (results.length > 0) {
        const result = results[0];
        handleMapFocus(result.latitude, result.longitude);
        
        // Add a temporary marker for the search result
        const searchMarker: MapMarker = {
          id: `search-${Date.now()}`,
          type: 'user',
          latitude: result.latitude,
          longitude: result.longitude,
          data: {
            name: result.name,
            address: result.address
          } as any
        };
        
        setMarkers(prev => [searchMarker, ...prev]);
        
        // Remove search marker after 10 seconds
        setTimeout(() => {
          setMarkers(prev => prev.filter(m => m.id !== searchMarker.id));
        }, 10000);
      }
      
      console.log('✅ Search completed:', results);
    } catch (error) {
      console.error('❌ Search error:', error);
      // Show error message to user
      setSearchResults([{
        id: 'error',
        name: 'Search failed',
        latitude: 0,
        longitude: 0,
        address: 'Please try again or check your connection',
        type: 'error'
      }]);
      setShowSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  };


  // Get emergency status via orchestrator
  const handleGetEmergencyStatus = async (sosId: string) => {
    try {
      console.log('📊 Getting emergency status via orchestrator:', sosId);
      const status = await orchestratorService.getEmergencyStatus(sosId);
      console.log('✅ Emergency status retrieved:', status);
      
      // Update local state with orchestrator data
      setSosEvents(prev => 
        prev.map(e => 
          e.id === sosId 
            ? { 
                ...e, 
                status: status.status === 'in_progress' ? 'assigned' : status.status as any,
                priority: typeof status.priority === 'string' ? 
                  (status.priority === 'low' ? 1 : 
                   status.priority === 'medium' ? 2 : 
                   status.priority === 'high' ? 3 : 4) : status.priority,
                description: status.description,
                updated_at: status.updated_at,
                resolved_at: status.resolved_at,
                assigned_helper_id: status.assigned_helper_id,
                assigned_responder_id: status.assigned_responder_id
              }
            : e
        )
      );
      
      return status;
    } catch (error) {
      console.error('❌ Error getting emergency status:', error);
      throw error;
    }
  };

  // Update emergency status via orchestrator
  const handleUpdateEmergencyStatus = async (sosId: string, status: string, message: string) => {
    try {
      console.log('🔄 Updating emergency status via orchestrator:', sosId, status);
      const result = await orchestratorService.updateEmergencyStatus(sosId, status as any, message);
      console.log('✅ Emergency status updated:', result);
      
      // Update local state
      setSosEvents(prev => 
        prev.map(e => 
          e.id === sosId 
            ? { ...e, status: (result.new_status === 'in_progress' ? 'assigned' : result.new_status) as any, updated_at: result.updated_at }
            : e
        )
      );
      
      return result;
    } catch (error) {
      console.error('❌ Error updating emergency status:', error);
      throw error;
    }
  };

  // SOS Event Action Handlers
  const handleViewStream = async (event: SOSEvent) => {
    try {
      console.log('📹 Starting live stream for event:', event.id);
      setSelectedEventForStream(event);
      setIsStreaming(true);
      
      // Generate fallback URL
      const streamId = `sos-${event.id}-${Date.now()}`;
      const fallbackUrl = `https://example.com/stream/${streamId}.m3u8`;
      setStreamUrl(fallbackUrl);
      
      // Switch to HLS Player tab
      setActiveTab('hls-player');
      
    } catch (error) {
      console.error('❌ Error starting stream:', error);
      setIsStreaming(false);
      alert('Failed to start live stream. Please try again.');
    }
  };

  const handleCallUser = (event: SOSEvent) => {
    try {
      console.log('📞 Calling user for event:', event.id);
      
      // In a real implementation, this would integrate with a calling service
      // For now, we'll show a notification
      alert(`Calling user for SOS event: ${event.emergency_type}\nLocation: ${event.latitude}, ${event.longitude}\nTime: ${new Date(event.created_at).toLocaleString()}`);
      
      console.log('✅ Call initiated for user');
    } catch (error) {
      console.error('❌ Error calling user:', error);
    }
  };

  const handleFocusMap = (event: SOSEvent) => {
    try {
      console.log('🗺️ Focusing map on event:', event.id);
      
      if (event.latitude && event.longitude) {
        handleMapFocus(event.latitude, event.longitude);
        console.log('✅ Map focused on event location');
      } else {
        console.warn('⚠️ Event has no location data');
        alert('No location data available for this event');
      }
    } catch (error) {
      console.error('❌ Error focusing map:', error);
    }
  };

  const handleResolveEvent = (event: SOSEvent) => {
    const resolveEvent = async () => {
      try {
        console.log('✅ Resolving event via orchestrator:', event.id);
        
        // Use orchestrator to end emergency
        const resolutionNotes = `Emergency resolved by admin at ${new Date().toLocaleString()}`;
        const result = await orchestratorService.endEmergency(event.id, resolutionNotes);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to resolve emergency via orchestrator');
        }
        
        // Update local state
        setSosEvents(prev => 
          prev.map(e => 
            e.id === event.id 
              ? { ...e, status: 'resolved', resolved_at: result.resolved_at }
              : e
          )
        );
        
        console.log('✅ Event resolved successfully via orchestrator');
        alert(`SOS event "${event.emergency_type}" has been resolved via orchestrator\nResponse time: ${result.response_time}s`);
      } catch (error) {
        console.error('❌ Error resolving event via orchestrator:', error);
        
        // Fallback to direct database update
        try {
          console.log('🔄 Falling back to direct database update...');
          const { error } = await supabase
            .from('sos_alerts')
            .update({ 
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', event.id);
          
          if (error) {
            throw error;
          }
          
          // Update local state
          setSosEvents(prev => 
            prev.map(e => 
              e.id === event.id 
                ? { ...e, status: 'resolved', resolved_at: new Date().toISOString() }
                : e
            )
          );
          
          console.log('✅ Event resolved via fallback method');
          alert(`SOS event "${event.emergency_type}" has been resolved (fallback method)`);
        } catch (fallbackError) {
          console.error('❌ Fallback resolution also failed:', fallbackError);
          alert('Failed to resolve event. Please try again.');
        }
      }
    };
    
    resolveEvent();
  };

  // Create new SOS event directly in database
  const handleCreateSOSEvent = async (userLocation: { lat: number, lng: number }) => {
    try {
      console.log('🚨 Creating new SOS event...');
      
      const { data, error } = await supabase
        .from('sos_alerts')
        .insert([{
          user_id: 'admin-test-user',
          emergency_type: 'other',
          description: 'Test SOS event created by admin',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          address: 'Test Location',
          priority: 'medium',
          status: 'active',
          is_test: true,
          triggered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ SOS event created successfully:', data);
      alert(`SOS event created successfully!\nEvent ID: ${data.id}`);
      
      // Refresh SOS events to show the new one
      const sosAlerts = await SOSDataService.fetchAllSOSAlerts();
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
    } catch (error) {
      console.error('❌ Error creating SOS event:', error);
      alert('Failed to create SOS event. Please try again.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 shadow-[0_0_20px_#00fff7]"></div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-black font-mono text-white admin-dashboard">
        {/* Fixed Header Bar */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-black/95 border-b border-cyan-400/50 z-50 shadow-[0_0_8px_#00fff7]">
          <div className="flex items-center justify-between px-4 h-full">
            {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-cyan-300">SOS Command</span>
                <div className="w-1 h-5 bg-cyan-400 rounded-full"></div>
              </div>
            

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
                onClick={handleFullscreenToggle}
                className="bg-blue-500/20 text-blue-300 border-blue-400 hover:bg-blue-500/30 transition-all duration-200 text-sm"
              >
                {isFullscreen ? <Minimize2 className="w-3 h-3 mr-1" /> : <Maximize2 className="w-3 h-3 mr-1" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleConnectionMode}
                className="bg-purple-500/20 text-purple-300 border-purple-400 hover:bg-purple-500/30 transition-all duration-200 text-sm"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Connection
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualOverride}
                className={`${isManualOverride ? 'bg-red-500/20 text-red-300 border-red-400 hover:bg-red-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-400 hover:bg-orange-500/30'} transition-all duration-200 text-sm`}
              >
                {isManualOverride ? <ToggleRight className="w-3 h-3 mr-1" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                Manual Override
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowEncryptionModal(true);
                }}
                className="bg-green-500/20 text-green-300 border-green-400 hover:bg-green-500/30 transition-all duration-200 text-sm"
              >
                <Lock className="w-3 h-3 mr-1" />
                Encryption
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowPowerModeModal(true);
                }}
                className="bg-yellow-500/20 text-yellow-300 border-yellow-400 hover:bg-yellow-500/30 transition-all duration-200 text-sm"
              >
                <Battery className="w-3 h-3 mr-1" />
                Power Mode
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  console.log('🎯 Testing orchestrator connection...');
                  try {
                    // First test basic connectivity
                    const connectivityTest = await orchestratorService.testBasicConnectivity();
                    console.log('🔗 Connectivity test result:', connectivityTest);
                    
                    // Then test full connection
                    const testResult = await orchestratorService.testConnection();
                    console.log('🎯 Full test result:', testResult);
                    
                    if (testResult.success) {
                      console.log('✅ Orchestrator test successful:', testResult);
                      const endpointInfo = testResult.endpoint || 'Direct';
                      const connectivityInfo = connectivityTest.details?.endpoint || 'Direct';
                      alert(`✅ Orchestrator connection successful!\n\nLatency: ${testResult.latency}ms\nFunction: ${orchestratorService.getFunctionName()}\nConnection: ${endpointInfo}\nConnectivity: ${connectivityInfo}\n\n🔧 Note: Using ${endpointInfo === 'CORS Proxy' ? 'CORS proxy (temporary fix)' : 'direct connection'}`);
                      setConnectionStatus(prev => ({ ...prev, orchestrator: 'connected' }));
                    } else {
                      console.error('❌ Orchestrator test failed:', testResult);
                      const errorMsg = testResult.error || 'Unknown error';
                      const endpointInfo = testResult.endpoint || 'Failed';
                      
                      // Check if it's a CORS error
                      const isCorsError = errorMsg.includes('CORS') || errorMsg.includes('Access-Control-Allow-Origin');
                      
                      if (isCorsError) {
                        alert(`🚨 CORS Error Detected!\n\nError: ${errorMsg}\nLatency: ${testResult.latency}ms\nEndpoint: ${endpointInfo}\n\n🔧 AUTOMATIC FALLBACK APPLIED:\nThe system tried both direct connection and CORS proxy.\n\n📋 PERMANENT SOLUTION:\n1. Update the orchestrator-new function with CORS headers\n2. Redeploy the function to Supabase\n3. Test again\n\n📖 See CORS_FIX_GUIDE.md for detailed instructions.\n\nConnectivity Test: ${connectivityTest.success ? 'PASSED' : 'FAILED'}`);
                      } else {
                        alert(`❌ Orchestrator connection failed!\n\nError: ${errorMsg}\nLatency: ${testResult.latency}ms\nEndpoint: ${endpointInfo}\n\n🔧 The system tried both direct connection and CORS proxy.\n\nConnectivity Test: ${connectivityTest.success ? 'PASSED' : 'FAILED'}\nCheck browser console for detailed logs.`);
                      }
                      
                      setConnectionStatus(prev => ({ ...prev, orchestrator: 'disconnected' }));
                    }
                  } catch (error) {
                    console.error('❌ Orchestrator test error:', error);
                    alert(`❌ Orchestrator test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console for detailed logs.`);
                    setConnectionStatus(prev => ({ ...prev, orchestrator: 'disconnected' }));
                  }
                }}
                className="bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 transition-all duration-200 text-sm"
              >
                <Activity className="w-3 h-3 mr-1" />
                Test Orchestrator
              </Button>
                  </div>
                      </div>
        </header>

        {/* Main Content Area - Below Fixed Header */}
        <main className="pt-14 h-screen bg-black">
            {/* New SOS Notification */}
            {newSOSNotification.show && (
              <div className="fixed top-20 right-4 z-50 animate-pulse">
                <Card className="bg-red-900/95 border-red-400/50 shadow-[0_0_20px_#ef4444] max-w-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-400 animate-bounce" />
                      <div>
                        <h3 className="font-bold text-red-300">NEW SOS TRIGGER!</h3>
                        <p className="text-sm text-red-200">
                          {newSOSNotification.event?.emergencyType} - {newSOSNotification.event?.userName}
                        </p>
                        <p className="text-xs text-red-300">
                          Priority: {newSOSNotification.event?.priority?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-300 border-red-400 hover:bg-red-400/20"
                        onClick={() => {
                          if (newSOSNotification.event?.latitude && newSOSNotification.event?.longitude) {
                            handleMapFocus(
                              newSOSNotification.event.latitude,
                              newSOSNotification.event.longitude,
                              {
                                persist: true,
                                sosId: newSOSNotification.event?.id,
                                label: `${newSOSNotification.event?.userName || 'Victim'} - ${newSOSNotification.event?.emergencyType || 'SOS'}`
                              }
                            );
                            setNewSOSNotification(prev => ({ ...prev, show: false }));
                          } else {
                            alert('Location data not available for this SOS alert.');
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        OK
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-300 border-blue-400 hover:bg-blue-400/20"
                        onClick={() => {
                          if (newSOSNotification.event) {
                            setActiveTab('realtime-sos');
                            setSelectedEventForStream(newSOSNotification.event);
                            setNewSOSNotification(prev => ({ ...prev, show: false }));
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Trigger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-300 border-gray-400 hover:bg-gray-400/20"
                        onClick={() => setNewSOSNotification(prev => ({ ...prev, show: false }))}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
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
                    <div className="text-gray-500">{responders.filter(r => r?.status === 'available').length} available</div>
                </div>

                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">ALL HELPERS</div>
                    <div className="text-gray-500">{helpers.filter(h => h?.status === 'available').length} available</div>
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
                {/* Overview Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-sm py-2 transition-all duration-200 ${
                    activeTab === 'overview' 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_#00fff7]' 
                      : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></div>
                  Overview
                </Button>

                {/* Real-time SOS Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('realtime-sos')}
                  className={`w-full text-sm py-2 transition-all duration-200 ${
                    activeTab === 'realtime-sos' 
                      ? 'bg-red-500/20 text-red-300 border-red-400 shadow-[0_0_8px_#ef4444]' 
                      : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400'
                  }`}
                >
                  <Radio className="w-4 h-4 mr-2 text-red-400" />
                  Real-time SOS
                </Button>

                {/* HLS Player Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('hls-player')}
                  className={`w-full text-sm py-2 transition-all duration-200 ${
                    activeTab === 'hls-player' 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-[0_0_8px_#3b82f6]' 
                      : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400'
                  }`}
                >
                  <Monitor className="w-4 h-4 mr-2 text-blue-400" />
                  HLS Player
                </Button>

                {/* SOS History Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('sos-history')}
                  className={`w-full text-sm py-2 transition-all duration-200 ${
                    activeTab === 'sos-history' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_8px_#a855f7]' 
                      : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-2 text-purple-400" />
                  SOS History
                </Button>

                {/* SOS Report Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('sos-report')}
                  className={`w-full text-sm py-2 transition-all duration-200 ${
                    activeTab === 'sos-report' 
                      ? 'bg-green-500/20 text-green-300 border-green-400 shadow-[0_0_8px_#22c55e]' 
                      : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-green-500/20 hover:text-green-300 hover:border-green-400'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  SOS Report
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Area - 8 columns */}
          <div className="col-span-8 overflow-hidden">
            <div className="w-full h-full">
              {activeTab === 'overview' && (
                <div className="h-full">
                  {/* Map Panel */}
                  <Card className="bg-black/50 border-cyan-400/50 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-cyan-300 text-base font-medium">GEO-SPATIAL VIEW</CardTitle>
                        {focusedCoordinates && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded-md">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-300 font-mono">
                              {focusedCoordinates.lat.toFixed(6)}, {focusedCoordinates.lng.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="h-[calc(100%-60px)] overflow-hidden">
                      {/* Map Controls */}
                      <div className="flex gap-3 mb-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSOSMapView}
                          className={`text-sm transition-all duration-200 ${
                            activeMapView === 'sos'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_8px_#00fff7]'
                              : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          SOS MAP
                        </Button>
                        
                        {/* Location Pointer Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (userLocation) {
                              console.log('📍 Current user location:', userLocation);
                              handleMapFocus(userLocation.lat, userLocation.lng);
                            } else {
                              refreshLocation();
                            }
                          }}
                          className="bg-blue-500/20 text-blue-300 border-blue-400 hover:bg-blue-500/30 transition-all duration-200 text-sm"
                          title="Center on your location"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          LOCATION
                        </Button>
                        
                        
                        {/* Auto SOS Finder Status */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 border border-green-400 rounded-md text-sm">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${autoSOSFinderActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                            <span className="font-medium">AUTO SOS FINDER</span>
                          </div>
                          {detectedSOSCount > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              {detectedSOSCount} DETECTED
                            </span>
                          )}
                          <div className="text-xs text-green-400">
                            {autoSOSFinderActive ? 'SCANNING...' : 'PAUSED'}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAutoSOSFinderActive(!autoSOSFinderActive)}
                            className="text-green-300 hover:text-green-200 p-1 h-6 w-6"
                            title={autoSOSFinderActive ? 'Pause Auto SOS Finder' : 'Resume Auto SOS Finder'}
                          >
                            {autoSOSFinderActive ? '⏸️' : '▶️'}
                          </Button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="flex items-center gap-2 ml-auto">
                          <div className="relative search-container">
                            <input
                              type="text"
                              placeholder="Search location..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                              className="w-64 px-3 py-1.5 bg-black/50 border border-cyan-400/50 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSearchLocation}
                              disabled={isSearching}
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 p-1 h-6 w-6"
                            >
                              {isSearching ? (
                                <div className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Search className="w-3 h-3" />
                              )}
                            </Button>
                            
                            {/* Search Results Dropdown */}
                            {showSearchResults && searchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-cyan-400/50 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {searchResults.map((result, index) => (
                                  <div
                                    key={result.id}
                                    onClick={() => {
                                      handleMapFocus(result.latitude, result.longitude);
                                      setSearchQuery(result.name);
                                      setSearchResults([]);
                                      setShowSearchResults(false);
                                    }}
                                    className="px-3 py-2 hover:bg-cyan-500/20 cursor-pointer border-b border-gray-700 last:border-b-0"
                                  >
                                    <div className="text-sm text-cyan-300 font-medium">{result.name}</div>
                                    <div className="text-xs text-gray-400">{result.address}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Location Status and Retry Button */}
                        <div className="flex items-center gap-2">
                          {isLocationLoading ? (
                            <div className="flex items-center gap-2 text-xs text-yellow-400">
                              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                              <span>Getting Location...</span>
                            </div>
                          ) : locationError ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-red-400">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span>No GPS</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={refreshLocation}
                                className="text-xs bg-red-500/20 text-red-300 border-red-400 hover:bg-red-500/30"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            </div>
                          ) : userLocation ? (
                            <div className="flex items-center gap-2 text-xs text-green-400">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <span>{userLocation.city || 'GPS Active'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-green-300">
                                <MapPin className="w-3 h-3" />
                                <span>GPS PIN</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              <span>Location Unknown</span>
                            </div>
                          )}
                        </div>
                        {/* Location Manager and Supabase Map buttons hidden as requested */}
                        {/* 
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLocationManagerView}
                          className={`text-sm transition-all duration-200 ${
                            activeMapView === 'location'
                              ? 'bg-green-500/20 text-green-300 border-green-400 shadow-[0_0_8px_#22c55e]'
                              : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-green-500/20 hover:text-green-300 hover:border-green-400'
                          }`}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          LOCATION MANAGER
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSupabaseMapView}
                          className={`text-sm transition-all duration-200 ${
                            activeMapView === 'supabase'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-400 shadow-[0_0_8px_#3b82f6]'
                              : 'bg-gray-500/20 text-gray-300 border-gray-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400'
                          }`}
                        >
                          <Database className="w-3 h-3 mr-1" />
                          SUPABASE MAP
                        </Button>
                        */}
                      </div>
                      
                      {/* Map Status Indicator */}
                      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                          <span className="font-medium">
                            SOS EMERGENCY VIEW
                          </span>
                        </div>
                        <div className="w-px h-4 bg-gray-600"></div>
                        <div className="flex items-center gap-3">
                          <span className={`${mapFilters.showMarkers ? 'text-green-400' : 'text-gray-500'}`}>
                            Markers: {mapFilters.showMarkers ? 'ON' : 'OFF'}
                          </span>
                          <span className={`${mapFilters.showClusters ? 'text-green-400' : 'text-gray-500'}`}>
                            Clusters: {mapFilters.showClusters ? 'ON' : 'OFF'}
                          </span>
                          <span className={`${mapFilters.showRoutes ? 'text-green-400' : 'text-gray-500'}`}>
                            Routes: {mapFilters.showRoutes ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Map Display */}
                      <div className="h-[calc(100%-50px)] relative overflow-hidden rounded-lg border border-cyan-400/20">
                        <EnhancedAdminMap
                          markers={markers}
                          filters={mapFilters}
                          onMarkerClick={handleMarkerClick}
                          mapRef={mapRef}
                          setMapRef={setMapRef}
                          mapStyle={mapStyle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'realtime-sos' && (
                <div className="h-full overflow-hidden">
                  <RealtimeSOSDashboard 
                    onSOSTrigger={handleSOSTrigger}
                    onMapFocus={handleMapFocus}
                    onViewStream={handleViewStream}
                    onCallUser={handleCallUser}
                    onResolveEvent={handleResolveEvent}
                  />
                </div>
              )}

              {activeTab === 'hls-player' && (
                <div className="h-full overflow-hidden">
                  <HLSPlayerDashboard 
                    streamUrl={streamUrl}
                    isStreaming={isStreaming}
                    selectedEvent={selectedEventForStream}
                  />
                </div>
              )}

              {activeTab === 'sos-history' && (
                <div className="h-full overflow-hidden">
                  <SOSHistoryDashboard onMapFocus={handleMapFocus} />
                </div>
              )}

              {activeTab === 'sos-report' && (
                <div className="h-full overflow-hidden">
                  <SOSReportDashboard />
                </div>
              )}

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
                {/* Emergency Statistics */}
                  <div className="text-center">
                  <div className="text-xl font-bold text-red-500 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {stats.activeSOS} Active
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Total SOS Events: {sosEvents.length}</div>
                  <div className="text-xs text-gray-400">Critical Cases: {sosEvents.filter(e => String(e.priority) === 'critical').length}</div>
                </div>

                {/* Real-time Statistics */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">RESPONSE TEAM</div>
                    <div className="text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Available Helpers:</span>
                        <span className="text-green-400">{stats.availableHelpers}/{stats.totalHelpers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available Responders:</span>
                        <span className="text-blue-400">{stats.availableResponders}/{stats.totalResponders}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">RECENT ACTIVITY</div>
                    {sosEvents.length > 0 ? (
                      <div className="space-y-1">
                        {sosEvents.slice(0, 3).map(event => (
                          <div key={event.id} className="text-xs text-gray-500 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              String(event.priority) === 'critical' ? 'bg-red-500' :
                              String(event.priority) === 'high' ? 'bg-orange-500' :
                              String(event.priority) === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="truncate">{event.emergency_type}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                    <div className="text-gray-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                        No recent activity
                  </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LIVE SOS FEED Panel */}
            <Card className="bg-black/50 border-cyan-400/50 flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-cyan-300 text-sm font-medium">LIVE SOS FEED</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sosEvents.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sosEvents.slice(0, 5).map(event => (
                      <div key={event.id} className="p-2 bg-gray-800/50 rounded border border-gray-600/50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              String(event.priority) === 'critical' ? 'bg-red-500 animate-pulse' :
                              String(event.priority) === 'high' ? 'bg-orange-500' :
                              String(event.priority) === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-xs font-medium text-cyan-300">{event.emergency_type.toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-gray-400">{formatRelativeTime(event.created_at)}</span>
                        </div>
                        <div className="text-xs text-gray-300 mb-1">
                          {event.description || 'Emergency alert'}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">
                            Status: <span className={getStatusColor(event.status)}>{event.status}</span>
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSOSEvent(event);
                              }}
                              className="text-xs h-6 px-2 text-cyan-400 hover:text-cyan-300"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await handleGetEmergencyStatus(event.id);
                                  alert(`Emergency status refreshed for ${event.emergency_type}`);
                                } catch (error) {
                                  alert(`Failed to refresh status: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }}
                              className="text-xs h-6 px-2 text-green-400 hover:text-green-300"
                              title="Refresh status via orchestrator"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-sm flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    No SOS events
                  </div>
                </div>
                )}
                
                {/* Feed Statistics */}
                <div className="space-y-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">
                    <div className="font-medium mb-1">FEED STATISTICS</div>
                    <div className="text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Total Events:</span>
                        <span>{sosEvents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Now:</span>
                        <span className="text-red-400">{stats.activeSOS}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved Today:</span>
                        <span className="text-green-400">{sosEvents.filter(e => (e.status as string) === 'resolved').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

            {/* Encryption Modal */}
        {showEncryptionModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black/95 border border-green-400/50 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-300">Encryption Panel</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEncryptionModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
                </div>
              <EncryptionPanel />
                      </div>
                      </div>
        )}

        {/* Power Mode Modal */}
        {showPowerModeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black/95 border border-yellow-400/50 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-yellow-300">Power Mode Panel</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPowerModeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
                    </div>
              <SmartPowerMode />
                    </div>
                    </div>
        )}

        {/* Connection Status Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black/95 border border-purple-400/50 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-purple-300">Connection Status Panel</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConnectionModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Frontend Connection */}
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${connectionStatus.frontend === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="text-white font-medium">Frontend</h3>
                      <p className="text-sm text-gray-400">React Application Status</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionStatus.frontend === 'connected' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${connectionStatus.frontend === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionStatus.frontend.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Backend Connection */}
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${connectionStatus.backend === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="text-white font-medium">Backend (Supabase)</h3>
                      <p className="text-sm text-gray-400">Database & API Services</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionStatus.backend === 'connected' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${connectionStatus.backend === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                      {connectionStatus.backend.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Orchestrator Connection */}
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionStatus.orchestrator === 'connected' ? 'bg-green-500' : 
                      connectionStatus.orchestrator === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <h3 className="text-white font-medium">Orchestrator (Unified)</h3>
                      <p className="text-sm text-gray-400">orchestrator-new Function</p>
                      {connectionStatus.orchestrator === 'connected' && (
                        <p className="text-xs text-green-400 mt-1">✓ CORS proxy fallback active</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionStatus.orchestrator === 'connected' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : connectionStatus.orchestrator === 'disconnected' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      connectionStatus.orchestrator === 'connected' ? 'text-green-400' : 
                      connectionStatus.orchestrator === 'disconnected' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {connectionStatus.orchestrator.toUpperCase()}
                    </span>
                  </div>
                </div>


                {/* Overall Status */}
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Overall System Status</h3>
                    <div className="flex items-center gap-2">
                      <Activity className={`w-5 h-5 ${
                        connectionStatus.orchestrator === 'connected' ? 'text-green-400' : 
                        connectionStatus.orchestrator === 'disconnected' ? 'text-yellow-400' : 'text-red-400'
                      }`} />
                      <span className={`font-medium ${
                        connectionStatus.orchestrator === 'connected' ? 'text-green-400' : 
                        connectionStatus.orchestrator === 'disconnected' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {connectionStatus.orchestrator === 'connected' ? 'OPERATIONAL' : 
                         connectionStatus.orchestrator === 'disconnected' ? 'DEGRADED' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {connectionStatus.orchestrator === 'connected' 
                      ? 'All systems are functioning normally. Orchestrator connected via fallback method.'
                      : connectionStatus.orchestrator === 'disconnected'
                      ? 'Core systems operational. Orchestrator connection issues detected - using fallback methods.'
                      : 'System experiencing connectivity issues. Check network and service status.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
                    </div>
        </div>
      )}

      </div>
  );
};

export default AdminDashboard; 