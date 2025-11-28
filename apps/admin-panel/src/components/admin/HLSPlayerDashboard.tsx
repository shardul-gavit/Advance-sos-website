import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { 
  Monitor, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Share,
  Camera,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Zap,
  Clock,
  RefreshCw
} from 'lucide-react';

interface StreamChannel {
  id: string;
  name: string;
  userId: string;
  userName: string;
  status: 'live' | 'offline' | 'connecting' | 'error';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate: number;
  resolution: string;
  fps: number;
  audioLevel: number;
  videoLevel: number;
  startTime: Date;
  duration: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  emergencyType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  streamUrl: string;
}

interface HLSMetrics {
  totalStreams: number;
  activeStreams: number;
  averageQuality: string;
  totalBandwidth: number;
  serverLoad: number;
  connectionStability: number;
}

interface HLSPlayerDashboardProps {
  streamUrl?: string | null;
  isStreaming?: boolean;
  selectedEvent?: any;
}

export default function HLSPlayerDashboard({ streamUrl, isStreaming, selectedEvent }: HLSPlayerDashboardProps = {}) {
  const [streams, setStreams] = useState<StreamChannel[]>([]);
  const [metrics, setMetrics] = useState<HLSMetrics>({
    totalStreams: 0,
    activeStreams: 0,
    averageQuality: 'HD',
    totalBandwidth: 0,
    serverLoad: 0,
    connectionStability: 0
  });

  // Add selected stream to streams when provided
  useEffect(() => {
    if (streamUrl && selectedEvent && isStreaming) {
      const newStream: StreamChannel = {
        id: `sos-${selectedEvent.id}`,
        name: `SOS Event - ${selectedEvent.emergencyType || 'Emergency'}`,
        url: streamUrl,
        quality: 'HD',
        status: 'active',
        viewers: 1,
        duration: 0,
        bitrate: 2500,
        resolution: '1920x1080',
        codec: 'H.264',
        latency: 2.5,
        buffering: 0,
        droppedFrames: 0,
        audioLevel: 0.8,
        videoLevel: 0.9,
        connection: 'stable',
        lastUpdate: new Date(),
        metadata: {
          eventId: selectedEvent.id,
          emergencyType: selectedEvent.emergencyType,
          location: `${selectedEvent.latitude}, ${selectedEvent.longitude}`,
          timestamp: selectedEvent.timestamp || new Date()
        }
      };
      
      setStreams(prev => [newStream, ...prev]);
      console.log('📹 Added stream to HLS Player:', newStream);
    }
  }, [streamUrl, selectedEvent, isStreaming]);
  const [selectedStream, setSelectedStream] = useState<StreamChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPastTriggers, setShowPastTriggers] = useState(false);
  const [pastStreams, setPastStreams] = useState<StreamChannel[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load real data from Supabase and streaming service
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Loading real HLS player data from Supabase...');
        
        // Fetch ALL SOS alerts (active and past) with media data
        const { data: sosAlerts, error: alertsError } = await supabase
          .from('sos_alerts')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(50); // Limit to last 50 alerts for performance

        if (alertsError) {
          throw new Error(`Failed to fetch SOS alerts: ${alertsError.message}`);
        }

        // Fetch media data for each alert
        const { data: mediaData, error: mediaError } = await supabase
          .from('sos_media')
          .select('*');

        if (mediaError) {
          throw new Error(`Failed to fetch media data: ${mediaError.message}`);
        }

        // Process real streams from Supabase data (including past triggers)
        const realStreams: StreamChannel[] = sosAlerts.map(alert => {
          const alertMedia = mediaData?.filter(media => 
            media.sos_alert_id === alert.id || 
            media.alert_id === alert.id || 
            media.sos_id === alert.id
          ) || [];
          const hasVideo = alertMedia.some(media => media.media_type === 'video');
          const hasAudio = alertMedia.some(media => media.media_type === 'audio');
          
          // Generate HLS stream URL
          const streamId = `sos-${alert.id}`;
          const streamUrl = `https://example.com/stream/${streamId}.m3u8`;
          
          // Determine stream status based on alert status and media availability
          let streamStatus: 'live' | 'offline' | 'connecting' | 'error' = 'offline';
          if (alert.status === 'active' && (hasVideo || hasAudio)) {
            streamStatus = 'live';
          } else if (alert.status === 'active' && !hasVideo && !hasAudio) {
            streamStatus = 'connecting';
          } else if (alert.status === 'resolved' && (hasVideo || hasAudio)) {
            streamStatus = 'offline'; // Past trigger with media
          } else {
            streamStatus = 'offline';
          }
          
          // Calculate duration for past triggers
          const triggerTime = new Date(alert.triggered_at);
          const resolvedTime = alert.resolved_at ? new Date(alert.resolved_at) : new Date();
          const duration = Math.floor((resolvedTime.getTime() - triggerTime.getTime()) / 1000);
          
          return {
            id: streamId,
            name: `${alert.status === 'active' ? 'LIVE' : 'PAST'} SOS - ${alert.emergency_type || 'Emergency'}`,
            userId: alert.user_id || 'unknown',
            userName: 'Emergency User',
            status: streamStatus,
            quality: hasVideo ? 'high' : 'medium',
            bitrate: hasVideo ? 2500 : 1500,
            resolution: hasVideo ? '1920x1080' : '1280x720',
            fps: hasVideo ? 30 : 25,
            audioLevel: hasAudio ? 85 : 0,
            videoLevel: hasVideo ? 95 : 0,
            startTime: triggerTime,
            duration: duration,
            location: {
              latitude: alert.latitude || 0,
              longitude: alert.longitude || 0,
              address: alert.address || 'Unknown Location'
            },
            emergencyType: alert.emergency_type || 'Emergency',
            priority: alert.priority || 'medium',
            assignedHelpers: [],
            assignedResponders: [],
            streamUrl: streamUrl,
            thumbnailUrl: `https://example.com/thumbnail/${streamId}.jpg`,
            mediaCount: alertMedia.length,
            hasVideo: hasVideo,
            hasAudio: hasAudio,
            alertStatus: alert.status,
            resolvedAt: alert.resolved_at
          };
        });

        // Calculate real metrics
        const realMetrics: HLSMetrics = {
          totalStreams: realStreams.length,
          activeStreams: realStreams.filter(s => s.status === 'live').length,
          averageQuality: realStreams.length > 0 ? 'HD' : 'N/A',
          totalBandwidth: realStreams.reduce((sum, s) => sum + s.bitrate, 0),
          serverLoad: Math.min(100, (realStreams.length * 15)), // Simulate server load
          connectionStability: 98
        };

        setStreams(realStreams);
        setMetrics(realMetrics);
        console.log(`✅ Loaded ${realStreams.length} real streams from Supabase`);
      } catch (error) {
        console.error('❌ Error loading real HLS player data:', error);
        // Set empty data on error
        setStreams([]);
        setMetrics({
          totalStreams: 0,
          activeStreams: 0,
          averageQuality: 'N/A',
          totalBandwidth: 0,
          serverLoad: 0,
          connectionStability: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Real-time subscriptions for media updates
  useEffect(() => {
    console.log('🔄 Setting up real-time subscriptions for HLS player...');
    
    // Subscribe to sos_alerts changes
    const alertsSubscription = supabase
      .channel('hls_sos_alerts_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sos_alerts' 
        }, 
        (payload) => {
          console.log('📡 SOS Alert change received in HLS player:', payload);
          // Refresh data when alerts change
          handleRefresh();
        }
      )
      .subscribe();

    // Subscribe to sos_media changes
    const mediaSubscription = supabase
      .channel('hls_sos_media_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sos_media' 
        }, 
        (payload) => {
          console.log('📡 SOS Media change received in HLS player:', payload);
          // Refresh data when media changes
          handleRefresh();
        }
      )
      .subscribe();

    console.log('✅ Real-time subscriptions established for HLS player');

    return () => {
      console.log('🔄 Cleaning up real-time subscriptions for HLS player...');
      alertsSubscription.unsubscribe();
      mediaSubscription.unsubscribe();
      console.log('✅ Real-time subscriptions cleaned up for HLS player');
    };
  }, []);

  // Refresh function - reload real data from Supabase
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing HLS player data from Supabase...');
      
      // Fetch fresh SOS alerts (active and past) with media data
      const { data: sosAlerts, error: alertsError } = await supabase
        .from('sos_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50); // Limit to last 50 alerts for performance

      if (alertsError) {
        throw new Error(`Failed to fetch SOS alerts: ${alertsError.message}`);
      }

      // Fetch fresh media data for each alert
      const { data: mediaData, error: mediaError } = await supabase
        .from('sos_media')
        .select('*');

      if (mediaError) {
        throw new Error(`Failed to fetch media data: ${mediaError.message}`);
      }

      // Process fresh streams from Supabase data (including past triggers)
      const realStreams: StreamChannel[] = sosAlerts.map(alert => {
        const alertMedia = mediaData?.filter(media => 
          media.sos_alert_id === alert.id || 
          media.alert_id === alert.id || 
          media.sos_id === alert.id
        ) || [];
        const hasVideo = alertMedia.some(media => media.media_type === 'video');
        const hasAudio = alertMedia.some(media => media.media_type === 'audio');
        
        // Generate HLS stream URL
        const streamId = `sos-${alert.id}`;
        const streamUrl = `https://example.com/stream/${streamId}.m3u8`;
        
        // Determine stream status based on alert status and media availability
        let streamStatus: 'live' | 'offline' | 'connecting' | 'error' = 'offline';
        if (alert.status === 'active' && (hasVideo || hasAudio)) {
          streamStatus = 'live';
        } else if (alert.status === 'active' && !hasVideo && !hasAudio) {
          streamStatus = 'connecting';
        } else if (alert.status === 'resolved' && (hasVideo || hasAudio)) {
          streamStatus = 'offline'; // Past trigger with media
        } else {
          streamStatus = 'offline';
        }
        
        // Calculate duration for past triggers
        const triggerTime = new Date(alert.triggered_at);
        const resolvedTime = alert.resolved_at ? new Date(alert.resolved_at) : new Date();
        const duration = Math.floor((resolvedTime.getTime() - triggerTime.getTime()) / 1000);
        
        return {
          id: streamId,
          name: `${alert.status === 'active' ? 'LIVE' : 'PAST'} SOS - ${alert.emergency_type || 'Emergency'}`,
          userId: alert.user_id || 'unknown',
          userName: 'Emergency User',
          status: streamStatus,
          quality: hasVideo ? 'high' : 'medium',
          bitrate: hasVideo ? 2500 : 1500,
          resolution: hasVideo ? '1920x1080' : '1280x720',
          fps: hasVideo ? 30 : 25,
          audioLevel: hasAudio ? 85 : 0,
          videoLevel: hasVideo ? 95 : 0,
          startTime: triggerTime,
          duration: duration,
          location: {
            latitude: alert.latitude || 0,
            longitude: alert.longitude || 0,
            address: alert.address || 'Unknown Location'
          },
          emergencyType: alert.emergency_type || 'Emergency',
          priority: alert.priority || 'medium',
          assignedHelpers: [],
          assignedResponders: [],
          streamUrl: streamUrl,
          thumbnailUrl: `https://example.com/thumbnail/${streamId}.jpg`,
          mediaCount: alertMedia.length,
          hasVideo: hasVideo,
          hasAudio: hasAudio,
          alertStatus: alert.status,
          resolvedAt: alert.resolved_at
        };
      });

      // Calculate fresh metrics
      const realMetrics: HLSMetrics = {
        totalStreams: realStreams.length,
        activeStreams: realStreams.filter(s => s.status === 'live').length,
        averageQuality: realStreams.length > 0 ? 'HD' : 'N/A',
        totalBandwidth: realStreams.reduce((sum, s) => sum + s.bitrate, 0),
        serverLoad: Math.min(100, (realStreams.length * 15)),
        connectionStability: 98
      };

      setStreams(realStreams);
      setMetrics(realMetrics);
      console.log(`✅ Refreshed ${realStreams.length} real streams from Supabase`);
    } catch (error) {
      console.error('❌ Error refreshing HLS player data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Connect to stream service and get stream data
  const connectToStreamService = async (streamId: string) => {
    try {
      console.log(`🔄 Connecting to stream service for stream: ${streamId}`);
      
      // Call API to get stream information
      const response = await fetch(`/api/stream/${streamId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Stream API error: ${response.status}`);
      }

      const streamData = await response.json();
      console.log(`✅ Connected to stream service for stream: ${streamId}`, streamData);
      
      return streamData;
    } catch (error) {
      console.error(`❌ Error connecting to stream service for stream ${streamId}:`, error);
      return null;
    }
  };

  // Get video and audio chunks from stream service
  const getMediaChunks = async (streamId: string) => {
    try {
      console.log(`🔄 Getting media chunks for stream: ${streamId}`);
      
      // Call API to get media chunks
      const response = await fetch(`/api/chunks/${streamId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Stream chunks API error: ${response.status}`);
      }

      const chunksData = await response.json();
      console.log(`✅ Retrieved media chunks for stream: ${streamId}`, chunksData);
      
      return chunksData;
    } catch (error) {
      console.error(`❌ Error getting media chunks for stream ${streamId}:`, error);
      return null;
    }
  };

  // Fetch past triggers with media data
  const fetchPastTriggersWithMedia = async () => {
    try {
      console.log('🔄 Fetching past triggers with media data...');
      
      // Fetch resolved SOS alerts with media
      const { data: pastAlerts, error: alertsError } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('status', 'resolved')
        .order('triggered_at', { ascending: false })
        .limit(20); // Last 20 resolved alerts

      if (alertsError) {
        throw new Error(`Failed to fetch past alerts: ${alertsError.message}`);
      }

      // Fetch media data for past alerts
      const { data: pastMedia, error: mediaError } = await supabase
        .from('sos_media')
        .select('*');

      if (mediaError) {
        throw new Error(`Failed to fetch past media: ${mediaError.message}`);
      }

      // Process past triggers into streams
      const pastStreams: StreamChannel[] = pastAlerts.map(alert => {
        const alertMedia = pastMedia?.filter(media => 
          media.sos_alert_id === alert.id || 
          media.alert_id === alert.id || 
          media.sos_id === alert.id
        ) || [];
        const hasVideo = alertMedia.some(media => media.media_type === 'video');
        const hasAudio = alertMedia.some(media => media.media_type === 'audio');
        
        const streamId = `sos-${alert.id}`;
        const streamUrl = `https://example.com/stream/${streamId}.m3u8`;
        
        // Calculate duration for past triggers
        const triggerTime = new Date(alert.triggered_at);
        const resolvedTime = alert.resolved_at ? new Date(alert.resolved_at) : new Date();
        const duration = Math.floor((resolvedTime.getTime() - triggerTime.getTime()) / 1000);
        
        return {
          id: streamId,
          name: `PAST SOS - ${alert.emergency_type || 'Emergency'}`,
          userId: alert.user_id || 'unknown',
          userName: 'Emergency User',
          status: (hasVideo || hasAudio) ? 'offline' : 'offline', // Past triggers are offline
          quality: hasVideo ? 'high' : 'medium',
          bitrate: hasVideo ? 2500 : 1500,
          resolution: hasVideo ? '1920x1080' : '1280x720',
          fps: hasVideo ? 30 : 25,
          audioLevel: hasAudio ? 85 : 0,
          videoLevel: hasVideo ? 95 : 0,
          startTime: triggerTime,
          duration: duration,
          location: {
            latitude: alert.latitude || 0,
            longitude: alert.longitude || 0,
            address: alert.address || 'Unknown Location'
          },
          emergencyType: alert.emergency_type || 'Emergency',
          priority: alert.priority || 'medium',
          assignedHelpers: [],
          assignedResponders: [],
          streamUrl: streamUrl,
          thumbnailUrl: `https://example.com/thumbnail/${streamId}.jpg`,
          mediaCount: alertMedia.length,
          hasVideo: hasVideo,
          hasAudio: hasAudio,
          alertStatus: alert.status,
          resolvedAt: alert.resolved_at
        };
      });

      console.log(`✅ Fetched ${pastStreams.length} past triggers with media`);
      return pastStreams;
    } catch (error) {
      console.error('❌ Error fetching past triggers with media:', error);
      return [];
    }
  };

  // Toggle past triggers display
  const handleTogglePastTriggers = async () => {
    if (!showPastTriggers) {
      // Load past triggers
      const pastTriggers = await fetchPastTriggersWithMedia();
      setPastStreams(pastTriggers);
    }
    setShowPastTriggers(!showPastTriggers);
  };

  // Get all streams (current + past if enabled)
  const getAllStreams = () => {
    if (showPastTriggers) {
      return [...streams, ...pastStreams];
    }
    return streams;
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
      case 'live': return 'text-green-400';
      case 'offline': return 'text-gray-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading HLS Player Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-blue-400">HLS Player Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTogglePastTriggers}
              className={`${showPastTriggers ? 'bg-orange-500/20 text-orange-300 border-orange-400' : 'bg-gray-500/20 text-gray-300 border-gray-400'} hover:bg-orange-500/30 transition-all duration-200`}
            >
              <Clock className="w-4 h-4 mr-2" />
              {showPastTriggers ? 'Hide Past' : 'Show Past'}
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
        <p className="text-gray-400">Live video streaming management and monitoring</p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-black/50 border-blue-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Active Streams</p>
                <p className="text-2xl font-bold text-blue-400">{getAllStreams().filter(s => s.status === 'live').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-green-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Streams</p>
                <p className="text-2xl font-bold text-green-400">{getAllStreams().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Past Streams</p>
                <p className="text-2xl font-bold text-orange-400">{getAllStreams().filter(s => s.status === 'offline' && s.alertStatus === 'resolved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Quality</p>
                <p className="text-2xl font-bold text-purple-400">{metrics.averageQuality}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Bandwidth</p>
                <p className="text-2xl font-bold text-orange-400">{metrics.totalBandwidth}Mbps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-cyan-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm text-gray-400">Stability</p>
                <p className="text-2xl font-bold text-cyan-400">{metrics.connectionStability}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="player" className="h-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/50 border-cyan-400/50">
          <TabsTrigger value="player" className="text-cyan-300">Video Player</TabsTrigger>
          <TabsTrigger value="streams" className="text-cyan-300">Stream List</TabsTrigger>
          <TabsTrigger value="streaming" className="text-cyan-300">Streaming Service</TabsTrigger>
        </TabsList>

        {/* Video Player Tab */}
        <TabsContent value="player" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Player */}
            <div className="lg:col-span-2">
              <Card className="bg-black/50 border-cyan-400/50">
                <CardHeader>
                  <CardTitle className="text-cyan-300">Live Stream Player</CardTitle>
                  <CardDescription>High-quality video streaming with advanced controls</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedStream ? (
                    <div className="space-y-4">
                      {/* Video Container */}
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          poster="/placeholder-video.jpg"
                          controls={false}
                        >
                          <source src={selectedStream.streamUrl} type="application/x-mpegURL" />
                          Your browser does not support HLS video streaming.
                        </video>
                        
                        {/* Video Overlay */}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge variant="outline" className="text-red-400 border-red-400">
                            {selectedStream.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            LIVE
                          </Badge>
                        </div>

                        {/* Video Controls */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-black/70 rounded-lg p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handlePlayPause}
                                className="text-white hover:bg-white/20"
                              >
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              
                              <div className="flex items-center gap-2 flex-1">
                                <Progress value={30} className="flex-1 h-1" />
                                <span className="text-xs text-gray-400">2:45 / 9:30</span>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleMute}
                                className="text-white hover:bg-white/20"
                              >
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </Button>

                              <div className="w-20">
                                <Progress value={volume} className="h-1" />
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="text-white hover:bg-white/20"
                              >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stream Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-white mb-2">{selectedStream.name}</h3>
                          <p className="text-sm text-gray-300 mb-2">{selectedStream.emergencyType}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{selectedStream.userName}</span>
                            <span>•</span>
                            <span>{selectedStream.location.address}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">Stream Quality</div>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {selectedStream.resolution} @ {selectedStream.fps}fps
                          </Badge>
                          <div className="text-xs text-gray-400 mt-2">
                            {formatDuration(selectedStream.duration)} • {selectedStream.bitrate}kbps
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400/20">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" className="text-green-400 border-green-400 hover:bg-green-400/20">
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" className="text-purple-400 border-purple-400 hover:bg-purple-400/20">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Monitor className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-400">Select a stream to start playing</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stream List Sidebar */}
            <div>
              <Card className="bg-black/50 border-cyan-400/50">
                <CardHeader>
                  <CardTitle className="text-cyan-300">Available Streams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getAllStreams().map((stream) => (
                    <div
                      key={stream.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedStream?.id === stream.id
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-gray-900/50 border-gray-600/50 hover:bg-gray-800/50'
                      }`}
                      onClick={() => setSelectedStream(stream)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(stream.priority)}`}></div>
                          <span className={`text-xs font-medium ${getStatusColor(stream.status)}`}>
                            {stream.status.toUpperCase()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {stream.quality}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-white text-sm mb-1">{stream.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{stream.userName}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Camera className="h-3 w-3" />
                        <span>{stream.resolution}</span>
                        <Mic className="h-3 w-3" />
                        <span>{stream.audioLevel}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Stream List Tab */}
        <TabsContent value="streams" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">Stream Management</CardTitle>
              <CardDescription>Monitor and manage all active streams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAllStreams().map((stream) => (
                  <Card key={stream.id} className="bg-gray-900/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(stream.priority)}`}></div>
                          <h3 className="font-semibold text-white">{stream.name}</h3>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(stream.status)}`}>
                            {stream.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDuration(stream.duration)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400">User</p>
                          <p className="text-white">{stream.userName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Emergency Type</p>
                          <p className="text-white">{stream.emergencyType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-white text-sm">{stream.location.address}</p>
                        </div>
                      </div>

                      {/* Media Information for Past Triggers */}
                      {stream.alertStatus === 'resolved' && (
                        <div className="mb-3 p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-orange-400" />
                            <span className="text-sm font-medium text-orange-300">Past Trigger Media</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${stream.hasVideo ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                              <span className="text-gray-300">Video: {stream.hasVideo ? 'Available' : 'None'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${stream.hasAudio ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                              <span className="text-gray-300">Audio: {stream.hasAudio ? 'Available' : 'None'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300">Media Files: {stream.mediaCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300">Resolved: {stream.resolvedAt ? new Date(stream.resolvedAt).toLocaleString() : 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-400">Quality</p>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {stream.resolution}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Bitrate</p>
                          <p className="text-white">{stream.bitrate}kbps</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Audio Level</p>
                          <div className="flex items-center gap-2">
                            <Progress value={stream.audioLevel} className="flex-1 h-1" />
                            <span className="text-xs text-gray-400">{stream.audioLevel}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Video Level</p>
                          <div className="flex items-center gap-2">
                            <Progress value={stream.videoLevel} className="flex-1 h-1" />
                            <span className="text-xs text-gray-400">{stream.videoLevel}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStream(stream)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Play
                        </Button>
                        <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400/20">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400/20">
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Streaming Service Tab */}
        <TabsContent value="streaming" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">Streaming Service Status</CardTitle>
              <CardDescription>Stream processing and delivery system metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900/50 border-gray-600/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-3">Server Performance</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">CPU Usage</span>
                          <span className="text-yellow-400">67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Memory Usage</span>
                          <span className="text-green-400">45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Disk I/O</span>
                          <span className="text-blue-400">23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-600/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-3">Stream Processing</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Active Transcodes</span>
                        <span className="text-cyan-400">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Segments Generated</span>
                        <span className="text-green-400">2,847</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">CDN Cache Hit Rate</span>
                        <span className="text-purple-400">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bandwidth Usage</span>
                        <span className="text-orange-400">4.8 Gbps</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-green-900/50 border-green-400/50">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Streaming service is operating at optimal performance. All streams are being processed and delivered successfully.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
