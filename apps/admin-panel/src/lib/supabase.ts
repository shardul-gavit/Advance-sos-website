import { createClient } from '@supabase/supabase-js';

// Fixed Supabase configuration with service role key
const supabaseUrl = "https://odkvcbnsimkhpmkllngo.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI1MjYzMiwiZXhwIjoyMDY3ODI4NjMyfQ.0qanU4VHNkQLYIWSkDw8kimy0jG0X72MkB5FXRWiRBo";

// Create Supabase client with service role key for admin panel
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'advance-sos-admin-panel'
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('sos_alerts').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          onboarding_completed: boolean;
          personal_info_completed: boolean;
          pin_created: boolean;
          permissions_granted: boolean;
          latitude: number | null;
          longitude: number | null;
          user_type: string | null;
          is_available: boolean | null;
          emergency_preferences: any | null;
          device_info: any | null;
          last_activity: string | null;
          fcm_token: string | null;
          role: string | null;
          phone: string | null;
          blood_group: string | null;
          date_of_birth: string | null;
          address: string | null;
          emergency_notes: string | null;
          last_active_at: string | null;
          name: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          onboarding_completed?: boolean;
          personal_info_completed?: boolean;
          pin_created?: boolean;
          permissions_granted?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          user_type?: string | null;
          is_available?: boolean | null;
          emergency_preferences?: any | null;
          device_info?: any | null;
          last_activity?: string | null;
          fcm_token?: string | null;
          role?: string | null;
          phone?: string | null;
          blood_group?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          emergency_notes?: string | null;
          last_active_at?: string | null;
          name?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          onboarding_completed?: boolean;
          personal_info_completed?: boolean;
          pin_created?: boolean;
          permissions_granted?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          user_type?: string | null;
          is_available?: boolean | null;
          emergency_preferences?: any | null;
          device_info?: any | null;
          last_activity?: string | null;
          fcm_token?: string | null;
          role?: string | null;
          phone?: string | null;
          blood_group?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          emergency_notes?: string | null;
          last_active_at?: string | null;
          name?: string | null;
        };
      };
      sos_alerts: {
        Row: {
          id: string;
          user_id: string;
          emergency_type: 'medical' | 'fire' | 'police' | 'other';
          status: 'active' | 'assigned' | 'resolved' | 'cancelled';
          priority: string;
          latitude: number;
          longitude: number;
          address: string | null;
          city: string | null;
          country: string | null;
          description: string | null;
          severity: string | null;
          is_test: boolean;
          last_status_message: string | null;
          triggered_at: string;
          last_media_update: string | null;
          last_status_update: string | null;
          resolved_at: string | null;
          updated_at: string;
          resolution_notes: string | null;
          resolved_by: string | null;
          device_info: any | null;
          app_version: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          emergency_type: 'medical' | 'fire' | 'police' | 'other';
          status?: 'active' | 'assigned' | 'resolved' | 'cancelled';
          priority?: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          description?: string | null;
          severity?: string | null;
          is_test?: boolean;
          last_status_message?: string | null;
          triggered_at?: string;
          last_media_update?: string | null;
          last_status_update?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
          resolution_notes?: string | null;
          resolved_by?: string | null;
          device_info?: any | null;
          app_version?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          emergency_type?: 'medical' | 'fire' | 'police' | 'other';
          status?: 'active' | 'assigned' | 'resolved' | 'cancelled';
          priority?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          description?: string | null;
          severity?: string | null;
          is_test?: boolean;
          last_status_message?: string | null;
          triggered_at?: string;
          last_media_update?: string | null;
          last_status_update?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
          resolution_notes?: string | null;
          resolved_by?: string | null;
          device_info?: any | null;
          app_version?: string | null;
          created_at?: string;
        };
      };
      helpers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          organization: string | null;
          skills: string[];
          latitude: number;
          longitude: number;
          status: 'available' | 'busy' | 'offline';
          emergency_types: string[];
          is_verified: boolean;
          is_test: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          organization?: string | null;
          skills?: string[];
          latitude: number;
          longitude: number;
          status?: 'available' | 'busy' | 'offline';
          emergency_types?: string[];
          is_verified?: boolean;
          is_test?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          organization?: string | null;
          skills?: string[];
          latitude?: number;
          longitude?: number;
          status?: 'available' | 'busy' | 'offline';
          emergency_types?: string[];
          is_verified?: boolean;
          is_test?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      responders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          organization: string;
          department: string;
          latitude: number;
          longitude: number;
          status: 'available' | 'busy' | 'offline';
          emergency_types: string[];
          is_verified: boolean;
          is_test: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone: string;
          organization: string;
          department: string;
          latitude: number;
          longitude: number;
          status?: 'available' | 'busy' | 'offline';
          emergency_types?: string[];
          is_verified?: boolean;
          is_test?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          organization?: string;
          department?: string;
          latitude?: number;
          longitude?: number;
          status?: 'available' | 'busy' | 'offline';
          emergency_types?: string[];
          is_verified?: boolean;
          is_test?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sos_media: {
        Row: {
          id: string;
          sos_id: string | null;
          sos_event_id: string | null;
          user_id: string;
          chunk_url: string | null;
          timestamp: string | null;
          chunk_sequence: number | null;
          file_size_bytes: number | null;
          camera_type: string | null;
          is_uploaded: boolean | null;
          created_at: string;
          media_data: any | null;
          chunk_number: number | null;
          chunk_size: number | null;
          file_url: string | null;
          media_type: string | null;
          metadata: any | null;
        };
        Insert: {
          id?: string;
          sos_id?: string | null;
          sos_event_id?: string | null;
          user_id: string;
          chunk_url?: string | null;
          timestamp?: string | null;
          chunk_sequence?: number | null;
          file_size_bytes?: number | null;
          camera_type?: string | null;
          is_uploaded?: boolean | null;
          created_at?: string;
          media_data?: any | null;
          chunk_number?: number | null;
          chunk_size?: number | null;
          file_url?: string | null;
          media_type?: string | null;
          metadata?: any | null;
        };
        Update: {
          id?: string;
          sos_id?: string | null;
          sos_event_id?: string | null;
          user_id?: string;
          chunk_url?: string | null;
          timestamp?: string | null;
          chunk_sequence?: number | null;
          file_size_bytes?: number | null;
          camera_type?: string | null;
          is_uploaded?: boolean | null;
          created_at?: string;
          media_data?: any | null;
          chunk_number?: number | null;
          chunk_size?: number | null;
          file_url?: string | null;
          media_type?: string | null;
          metadata?: any | null;
        };
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone_number: string;
          email: string | null;
          relationship: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone_number: string;
          email?: string | null;
          relationship: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone_number?: string;
          email?: string | null;
          relationship?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sos_status_history: {
        Row: {
          id: string;
          sos_event_id: string;
          user_id: string;
          status: string;
          previous_status: string | null;
          message: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sos_event_id: string;
          user_id: string;
          status: string;
          previous_status?: string | null;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sos_event_id?: string;
          user_id?: string;
          status?: string;
          previous_status?: string | null;
          message?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      admin_feed: {
        Row: {
          id: string;
          event_type: string;
          description: string | null;
          user_id: string | null;
          sos_event_id: string | null;
          severity: string | null;
          category: string | null;
          source: string | null;
          event_data: any | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          description?: string | null;
          user_id?: string | null;
          sos_event_id?: string | null;
          severity?: string | null;
          category?: string | null;
          source?: string | null;
          event_data?: any | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          description?: string | null;
          user_id?: string | null;
          sos_event_id?: string | null;
          severity?: string | null;
          category?: string | null;
          source?: string | null;
          event_data?: any | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      fcm_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          device_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Export types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Type aliases for convenience
export type User = Tables<'users'>;
export type SOSEvent = Tables<'sos_alerts'>;
// Helper and Responder are now User types with specific user_type values
export type Helper = User & { user_type: 'helper' };
export type Responder = User & { user_type: 'responder' };
export type SOSMedia = Tables<'sos_media'>;
export type EmergencyContact = Tables<'emergency_contacts'>;
export type SOSStatusHistory = Tables<'sos_status_history'>;
export type AdminFeed = Tables<'admin_feed'>;
export type FCMToken = Tables<'fcm_tokens'>;
// Legacy alias for backward compatibility
export type Media = SOSMedia;

// Base interfaces
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  onboarding_completed: boolean;
  personal_info_completed: boolean;
  pin_created: boolean;
  permissions_granted: boolean;
  latitude: number | null;
  longitude: number | null;
  user_type: string | null;
  is_available: boolean | null;
  emergency_preferences: any | null;
  device_info: any | null;
  last_activity: string | null;
  fcm_token: string | null;
  role: string | null;
  phone: string | null;
  blood_group: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_notes: string | null;
  last_active_at: string | null;
  name: string | null;
}

export interface SOSEvent {
  id: string;
  user_id: string;
  emergency_type: 'medical' | 'fire' | 'police' | 'other';
  status: 'active' | 'assigned' | 'resolved' | 'cancelled';
  priority: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  severity: string | null;
  is_test: boolean;
  last_status_message: string | null;
  triggered_at: string;
  last_media_update: string | null;
  last_status_update: string | null;
  resolved_at: string | null;
  updated_at: string;
  resolution_notes: string | null;
  resolved_by: string | null;
  device_info: any | null;
  app_version: string | null;
  created_at: string;
}

export interface Helper {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  emergency_types: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Responder {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  organization: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'busy' | 'offline';
  emergency_types: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_services: string[];
  created_at?: string;
}

export interface Media {
  id: string;
  sos_id: string | null;
  sos_event_id: string | null;
  user_id: string;
  chunk_url: string | null;
  timestamp: string | null;
  chunk_sequence: number | null;
  file_size_bytes: number | null;
  camera_type: string | null;
  is_uploaded: boolean | null;
  created_at: string;
  media_data: any | null;
  chunk_number: number | null;
  chunk_size: number | null;
  file_url: string | null;
  media_type: string | null;
  metadata: any | null;
  // Legacy fields for backward compatibility
  type?: 'image' | 'video' | 'audio';
  url?: string;
}

// Auth service
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          role: 'admin'
        }
      }
    });
    return { data, error };
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Location service functions
export const locationService = {
  // Fetch all locations
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('responder_location_history')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    
    return data || [];
  },

  // Insert a new location
  async insertLocation(name: string, latitude: number, longitude: number): Promise<Location> {
    const { data, error } = await supabase
      .from('responder_location_history')
      .insert([
        {
          name,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting location:', error);
      throw error;
    }
    
    return data;
  },

  // Insert a sample location
  async insertSampleLocation(): Promise<Location> {
    return this.insertLocation(
      'Sample Location',
      22.3072, // Vadodara coordinates
      73.1812
    );
  },

  // Subscribe to location changes
  subscribeToLocations(callback: (payload: any) => void) {
    return supabase
      .channel('locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responder_location_history' }, callback)
      .subscribe();
  }
};

// SOS Events service
export const sosEventService = {
  // Fetch all SOS events
  async getSOSEvents(): Promise<SOSEvent[]> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*')
      .order('triggered_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching SOS events:', error);
      throw error;
    }
    
    return data || [];
  },

  // Fetch active SOS events
  async getActiveSOSEvents(): Promise<SOSEvent[]> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('status', 'active')
      .order('triggered_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active SOS events:', error);
      throw error;
    }
    
    return data || [];
  },

  // Create new SOS event
  async createSOSEvent(event: Omit<SOSEvent, 'id' | 'created_at' | 'updated_at'>): Promise<SOSEvent> {
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert([event])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating SOS event:', error);
      throw error;
    }
    
    return data;
  },

  // Update SOS event status
  async updateSOSEventStatus(id: string, status: SOSEvent['status'], assigned_helper_id?: string): Promise<SOSEvent> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (assigned_helper_id) updateData.assigned_helper_id = assigned_helper_id;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('sos_alerts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating SOS event:', error);
      throw error;
    }
    
    return data;
  },

  // Subscribe to SOS event changes
  subscribeToSOSEvents(callback: (payload: any) => void) {
    return supabase
      .channel('sos_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_alerts' }, callback)
      .subscribe();
  }
};

// Helpers service
export const helperService = {
  // Fetch all helpers
  async getHelpers(): Promise<Helper[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'helper')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching helpers:', error);
      throw error;
    }
    
    return data || [];
  },

  // Fetch available helpers
  async getAvailableHelpers(): Promise<Helper[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'helper')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching available helpers:', error);
      throw error;
    }
    
    return data || [];
  },

  // Update helper location
  async updateHelperLocation(id: string, latitude: number, longitude: number): Promise<Helper> {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        latitude, 
        longitude, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .eq('user_type', 'helper')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating helper location:', error);
      throw error;
    }
    
    return data;
  },

  // Subscribe to helper changes
  subscribeToHelpers(callback: (payload: any) => void) {
    return supabase
      .channel('helpers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'user_type=eq.helper' }, callback)
      .subscribe();
  }
};

// Responders service
export const responderService = {
  // Fetch all responders
  async getResponders(): Promise<Responder[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'responder')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching responders:', error);
      throw error;
    }
    
    return data || [];
  },

  // Fetch available responders
  async getAvailableResponders(): Promise<Responder[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'responder')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching available responders:', error);
      throw error;
    }
    
    return data || [];
  },

  // Subscribe to responder changes
  subscribeToResponders(callback: (payload: any) => void) {
    return supabase
      .channel('responders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: 'user_type=eq.responder' }, callback)
      .subscribe();
  }
};

// Hospitals service
export const hospitalService = {
  // Fetch all hospitals
  async getHospitals(): Promise<Hospital[]> {
    const { data, error } = await supabase
      .from('emergency_services')
      .select('*')
      .eq('type', 'hospital')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching hospitals:', error);
      throw error;
    }
    
    return data || [];
  },

  // Subscribe to hospital changes
  subscribeToHospitals(callback: (payload: any) => void) {
    return supabase
      .channel('hospitals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_services', filter: 'type=eq.hospital' }, callback)
      .subscribe();
  }
};

// Media service
export const mediaService = {
  // Fetch media for SOS event
  async getMediaForSOSEvent(sosEventId: string): Promise<SOSMedia[]> {
    const { data, error } = await supabase
      .from('sos_media')
      .select('*')
      .or(`sos_event_id.eq.${sosEventId},sos_id.eq.${sosEventId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
    
    return data || [];
  },

  // Subscribe to media changes
  subscribeToMedia(callback: (payload: any) => void) {
    return supabase
      .channel('sos_media')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_media' }, callback)
      .subscribe();
  }
}; 