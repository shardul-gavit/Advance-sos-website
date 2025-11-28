import React, { useState } from 'react';
import { Play, Square, Settings, AlertTriangle, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { PushNotificationService } from '@/lib/firebase';

interface TestModeProps {
  onTestEventCreated?: (event: any) => void;
  className?: string;
}

interface TestEvent {
  id: string;
  emergency_type: 'medical' | 'fire' | 'police' | 'other';
  description: string;
  latitude: number;
  longitude: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'assigned' | 'resolved' | 'cancelled';
  created_at: string;
}

export const TestMode: React.FC<TestModeProps> = ({
  onTestEventCreated,
  className = ''
}) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testEvents, setTestEvents] = useState<TestEvent[]>([]);
  const [settings, setSettings] = useState({
    eventInterval: 30, // seconds
    maxEvents: 5,
    includeMedia: true,
    includeNotifications: true,
    autoAssign: false
  });

  // Test locations around Vadodara
  const testLocations = [
    { name: 'Vadodara City Center', lat: 22.3072, lng: 73.1812 },
    { name: 'Alkapuri', lat: 22.3150, lng: 73.1750 },
    { name: 'Gotri', lat: 22.3200, lng: 73.1700 },
    { name: 'Fatehgunj', lat: 22.3100, lng: 73.1850 },
    { name: 'Karelibaug', lat: 22.3250, lng: 73.1800 }
  ];

  const emergencyTypes = ['medical', 'fire', 'police', 'other'] as const;
  const priorities = ['low', 'medium', 'high', 'critical'] as const;

  const descriptions = {
    medical: [
      'Heart attack emergency',
      'Severe bleeding',
      'Unconscious person',
      'Difficulty breathing',
      'Severe allergic reaction'
    ],
    fire: [
      'Building fire',
      'Vehicle fire',
      'Electrical fire',
      'Kitchen fire',
      'Gas leak'
    ],
    police: [
      'Assault in progress',
      'Robbery',
      'Domestic violence',
      'Suspicious activity',
      'Traffic accident'
    ],
    other: [
      'Trapped in elevator',
      'Flooding',
      'Power outage',
      'Structural damage',
      'Animal emergency'
    ]
  };

  const generateTestEvent = (): TestEvent => {
    const location = testLocations[Math.floor(Math.random() * testLocations.length)];
    const emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const description = descriptions[emergencyType][Math.floor(Math.random() * descriptions[emergencyType].length)];

    return {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emergency_type: emergencyType,
      description,
      latitude: location.lat + (Math.random() - 0.5) * 0.01, // Add some randomness
      longitude: location.lng + (Math.random() - 0.5) * 0.01,
      priority,
      status: 'active',
      created_at: new Date().toISOString()
    };
  };

  const createTestSOSEvent = async (event: TestEvent) => {
    try {
      // Create test user if needed
      const testUserId = 'test-user-id';
      
      // Insert test SOS event
      const { data: sosEvent, error } = await supabase
        .from('sos_alerts')
        .insert({
          id: event.id,
          user_id: testUserId,
          emergency_type: event.emergency_type,
          description: event.description,
          latitude: event.latitude,
          longitude: event.longitude,
          priority: event.priority,
          status: event.status,
          is_test: true, // Mark as test event
          created_at: event.created_at
        })
        .select()
        .single();

      if (error) throw error;

      // Send test notification if enabled
      if (settings.includeNotifications) {
        await PushNotificationService.sendSOSNotification(
          event.id,
          testUserId,
          { address: 'Test Location' }
        );
      }

      // Add test media if enabled
      if (settings.includeMedia) {
        await createTestMedia(event.id, testUserId);
      }

      // Auto-assign if enabled
      if (settings.autoAssign) {
        await autoAssignHelper(event.id);
      }

      setTestEvents(prev => [...prev, event]);
      onTestEventCreated?.(sosEvent);

      console.log('Test SOS event created:', event);
    } catch (error) {
      console.error('Failed to create test SOS event:', error);
    }
  };

  const createTestMedia = async (sosEventId: string, userId: string) => {
    try {
      // Create test image
      const testImageUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      
      await supabase
        .from('sos_media')
        .insert({
          sos_event_id: sosEventId,
          user_id: userId,
          file_url: testImageUrl,
          media_type: 'image',
          file_size_bytes: 102400, // 100KB
          is_uploaded: true,
          timestamp: new Date().toISOString()
        });

      // Create test audio (simulated)
      await supabase
        .from('sos_media')
        .insert({
          sos_event_id: sosEventId,
          user_id: userId,
          file_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          media_type: 'audio',
          file_size_bytes: 51200, // 50KB
          is_uploaded: true,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to create test media:', error);
    }
  };

  const autoAssignHelper = async (sosEventId: string) => {
    try {
      // Get available helpers
      const { data: helpers } = await supabase
        .from('users')
        .select('id')
        .eq('user_type', 'helper')
        .eq('status', 'available')
        .limit(1);

      if (helpers && helpers.length > 0) {
        await supabase
          .from('sos_alerts')
          .update({
            assigned_helper_id: helpers[0].id,
            status: 'assigned'
          })
          .eq('id', sosEventId);
      }
    } catch (error) {
      console.error('Failed to auto-assign helper:', error);
    }
  };

  const startTestMode = () => {
    setIsTestMode(true);
    setIsRunning(true);
    
    const interval = setInterval(() => {
      if (!isRunning || testEvents.length >= settings.maxEvents) {
        clearInterval(interval);
        setIsRunning(false);
        return;
      }

      const testEvent = generateTestEvent();
      createTestSOSEvent(testEvent);
    }, settings.eventInterval * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const stopTestMode = () => {
    setIsRunning(false);
  };

  const clearTestEvents = async () => {
    try {
      // Delete test events from database
      await supabase
        .from('sos_alerts')
        .delete()
        .eq('is_test', true);

      // Delete test media (if there's an is_test field, otherwise delete by timestamp)
      await supabase
        .from('sos_media')
        .delete()
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Delete media from last 24 hours

      setTestEvents([]);
    } catch (error) {
      console.error('Failed to clear test events:', error);
    }
  };

  const createSingleTestEvent = () => {
    const testEvent = generateTestEvent();
    createTestSOSEvent(testEvent);
  };

  return (
    <Card className={`bg-black/50 border-cyan-400/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-cyan-300 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          TEST MODE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Test Mode</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTestMode(!isTestMode)}
            className={`${
              isTestMode 
                ? 'bg-green-500/20 text-green-300 border-green-400' 
                : 'bg-gray-500/20 text-gray-300 border-gray-400'
            }`}
          >
            {isTestMode ? 'ON' : 'OFF'}
          </Button>
        </div>

        {isTestMode && (
          <>
            {/* Test Controls */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={isRunning ? stopTestMode : startTestMode}
                className={`${
                  isRunning 
                    ? 'bg-red-500/20 text-red-300 border-red-400' 
                    : 'bg-green-500/20 text-green-300 border-green-400'
                }`}
              >
                {isRunning ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isRunning ? 'Stop' : 'Start'} Test
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={createSingleTestEvent}
                className="bg-blue-500/20 text-blue-300 border-blue-400"
              >
                Single Event
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={clearTestEvents}
                className="bg-orange-500/20 text-orange-300 border-orange-400"
              >
                Clear All
              </Button>
            </div>

            {/* Test Settings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Settings</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-400">Interval (sec)</label>
                  <input
                    type="number"
                    value={settings.eventInterval}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      eventInterval: parseInt(e.target.value) || 30 
                    }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                  />
                </div>
                
                <div>
                  <label className="text-gray-400">Max Events</label>
                  <input
                    type="number"
                    value={settings.maxEvents}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxEvents: parseInt(e.target.value) || 5 
                    }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.includeMedia}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      includeMedia: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  Include Test Media
                </label>
                
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.includeNotifications}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      includeNotifications: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  Send Notifications
                </label>
                
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={settings.autoAssign}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      autoAssign: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  Auto-assign Helpers
                </label>
              </div>
            </div>

            {/* Test Events List */}
            {testEvents.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Test Events ({testEvents.length})</span>
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {testEvents.slice(-5).map((event, index) => (
                    <div key={event.id} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded text-xs">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span className="text-gray-300">{event.emergency_type}</span>
                      <span className="text-gray-500">•</span>
                      <span className={`px-1 rounded text-xs ${
                        event.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                        event.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        event.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {event.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              {isRunning ? 'Test running...' : 'Test stopped'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 