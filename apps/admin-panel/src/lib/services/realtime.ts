import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeCallbacks {
  onSOSEvent?: (payload: any) => void;
  onHelper?: (payload: any) => void;
  onResponder?: (payload: any) => void;
  onHospital?: (payload: any) => void;
  onMedia?: (payload: any) => void;
  onUser?: (payload: any) => void;
  onLocation?: (payload: any) => void;
}

export class RealtimeService {
  private channels: RealtimeChannel[] = [];
  private callbacks: RealtimeCallbacks = {};

  subscribeToAll(callbacks: RealtimeCallbacks) {
    this.callbacks = callbacks;

    // Subscribe to SOS alerts (correct table name)
    const sosChannel = supabase
      .channel('sos_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
        },
        (payload) => {
          console.log('SOS Alert change:', payload);
          this.callbacks.onSOSEvent?.(payload);
        }
      )
      .subscribe();

    // Subscribe to helpers (from users table with user_type='helper')
    const helperChannel = supabase
      .channel('helpers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'user_type=eq.helper',
        },
        (payload) => {
          console.log('Helper change:', payload);
          this.callbacks.onHelper?.(payload);
        }
      )
      .subscribe();

    // Subscribe to responders (from users table with user_type='responder')
    const responderChannel = supabase
      .channel('responders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'user_type=eq.responder',
        },
        (payload) => {
          console.log('Responder change:', payload);
          this.callbacks.onResponder?.(payload);
        }
      )
      .subscribe();

    // Subscribe to hospitals (from emergency_services table with type='hospital')
    const hospitalChannel = supabase
      .channel('hospitals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_services',
          filter: 'type=eq.hospital',
        },
        (payload) => {
          console.log('Hospital change:', payload);
          this.callbacks.onHospital?.(payload);
        }
      )
      .subscribe();

    // Subscribe to sos_media (correct table name)
    const mediaChannel = supabase
      .channel('sos_media_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_media',
        },
        (payload) => {
          console.log('SOS Media change:', payload);
          this.callbacks.onMedia?.(payload);
        }
      )
      .subscribe();

    // Subscribe to users
    const userChannel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          console.log('User change:', payload);
          this.callbacks.onUser?.(payload);
        }
      )
      .subscribe();

    // Subscribe to locations (from responder_location_history table)
    const locationChannel = supabase
      .channel('locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responder_location_history',
        },
        (payload) => {
          console.log('Location change:', payload);
          this.callbacks.onLocation?.(payload);
        }
      )
      .subscribe();

    this.channels = [
      sosChannel,
      helperChannel,
      responderChannel,
      hospitalChannel,
      mediaChannel,
      userChannel,
      locationChannel,
    ];
  }

  subscribeToSOSEvents(callback: (payload: any) => void) {
    const channel = supabase
      .channel('sos_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToHelpers(callback: (payload: any) => void) {
    const channel = supabase
      .channel('helpers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'user_type=eq.helper',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToResponders(callback: (payload: any) => void) {
    const channel = supabase
      .channel('responders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'user_type=eq.responder',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToHospitals(callback: (payload: any) => void) {
    const channel = supabase
      .channel('hospitals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_services',
          filter: 'type=eq.hospital',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToMedia(callback: (payload: any) => void) {
    const channel = supabase
      .channel('sos_media_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_media',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToUsers(callback: (payload: any) => void) {
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  subscribeToLocations(callback: (payload: any) => void) {
    const channel = supabase
      .channel('locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responder_location_history',
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to specific SOS alert
  subscribeToSOSEvent(sosEventId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`sos_alert_${sosEventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
          filter: `id=eq.${sosEventId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to specific helper
  subscribeToHelper(helperId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`helper_${helperId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${helperId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to specific responder
  subscribeToResponder(responderId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`responder_${responderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${responderId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to specific user
  subscribeToUser(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to user locations (from users table)
  subscribeToUserLocations(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`user_locations_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Subscribe to media for specific SOS alert
  subscribeToSOSEventMedia(sosEventId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`sos_alert_media_${sosEventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_media',
          filter: `sos_alert_id=eq.${sosEventId}`,
        },
        callback
      )
      .subscribe();

    this.channels.push(channel);
    return channel;
  }

  // Unsubscribe from all channels
  unsubscribe() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
    this.callbacks = {};
  }

  // Unsubscribe from specific channel
  unsubscribeFromChannel(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
    this.channels = this.channels.filter(ch => ch !== channel);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.channels.length > 0,
      channelCount: this.channels.length,
    };
  }

  // Send message to specific channel (for admin notifications)
  sendMessage(channelName: string, message: any) {
    const channel = supabase.channel(channelName);
    return channel.send({
      type: 'broadcast',
      event: 'admin_message',
      payload: message,
    });
  }

  // Subscribe to admin messages
  subscribeToAdminMessages(callback: (message: any) => void) {
    const channel = supabase
      .channel('admin_messages')
      .on('broadcast', { event: 'admin_message' }, callback)
      .subscribe();

    this.channels.push(channel);
    return channel;
  }
} 