import { supabase } from '../lib/supabase';
import { toast } from '../hooks/use-toast';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
  city?: string;
  country?: string;
  address?: string;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface EmergencyLocation extends LocationData {
  id?: string;
  user_id?: string;
  emergency_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocationPermission {
  granted: boolean;
  type: 'granted' | 'denied' | 'prompt' | 'unsupported';
  message: string;
}

// Location tracking state
let locationWatchId: number | null = null;
let isTracking = false;
let currentLocation: LocationData | null = null;

// Location permission check
export const checkLocationPermission = async (): Promise<LocationPermission> => {
  if (!navigator.geolocation) {
    return {
      granted: false,
      type: 'unsupported',
      message: 'Geolocation is not supported by this browser.'
    };
  }

  try {
    // Check if permission is already granted
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: permission.state === 'granted',
        type: permission.state as 'granted' | 'denied' | 'prompt',
        message: permission.state === 'granted' 
          ? 'Location access granted.' 
          : permission.state === 'denied' 
            ? 'Location access denied. Please enable in browser settings.'
            : 'Location permission not yet requested.'
      };
    }

    // Fallback for browsers that don't support permissions API
    return {
      granted: true,
      type: 'prompt',
      message: 'Location permission status unknown. Will request when needed.'
    };
  } catch (error) {
    console.error('Error checking location permission:', error);
    return {
      granted: false,
      type: 'unsupported',
      message: 'Unable to check location permission.'
    };
  }
};

// Request location permission
export const requestLocationPermission = async (): Promise<LocationPermission> => {
  const permission = await checkLocationPermission();
  
  if (permission.type === 'granted') {
    return permission;
  }

  if (permission.type === 'denied') {
    toast({
      title: "Location Access Required",
      description: "Please enable location access in your browser settings to use emergency features.",
      variant: "destructive",
    });
    return permission;
  }

  // Try to get current location to trigger permission request
  try {
    await getCurrentLocation();
    return await checkLocationPermission();
  } catch (error) {
  return {
      granted: false,
      type: 'denied',
      message: 'Location permission denied by user.'
    };
  }
};

// Force location permission request - always prompts user
export const forceLocationPermission = async (): Promise<LocationPermission> => {
  // Always try to get current location to trigger permission request
  try {
    await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 0, // Don't use cache to force fresh permission request
      includeCityInfo: false
    });
    
    return {
      granted: true,
      type: 'granted',
      message: 'Location access granted.'
    };
  } catch (error) {
    return {
      granted: false,
      type: 'denied',
      message: 'Location permission denied by user.'
    };
  }
};

// Always request location permission regardless of previous status
export const alwaysRequestLocationPermission = async (): Promise<LocationPermission> => {
  // Clear any cached permission status
  if ('permissions' in navigator) {
    try {
      // This will trigger a fresh permission request
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        // Even if denied, try to get location to trigger browser prompt
        return await forceLocationPermission();
      }
    } catch (error) {
      console.log('Permission API not available, using fallback');
    }
  }
  
  // Always try to get location to trigger permission request
  return await forceLocationPermission();
};

// Ultra-fast location access with multiple fallback strategies
export const getUltraFastLocation = (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    let resolved = false;
    let timeoutId: NodeJS.Timeout;

    // Strategy 1: Try cached location with very short timeout
    const tryCachedLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            const locationData: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(locationData);
          }
        },
        () => {
          // Cached location failed, try network location
          tryNetworkLocation();
        },
        {
          enableHighAccuracy: false,
          timeout: 1000, // Very short timeout for cache
          maximumAge: 600000 // Accept 10-minute old cache
        }
      );
    };

    // Strategy 2: Try network-based location
    const tryNetworkLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            const locationData: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(locationData);
          }
        },
        () => {
          // Network location failed, try high accuracy as last resort
          tryHighAccuracyLocation();
        },
        {
          enableHighAccuracy: false,
          timeout: 3000, // Short timeout for network
          maximumAge: 0
        }
      );
    };

    // Strategy 3: Try high accuracy location as last resort
    const tryHighAccuracyLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            const locationData: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(locationData);
          }
        },
        (error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            
            // Use fallback location instead of rejecting
            const fallbackLocation: LocationData = {
              lat: 22.3321, // Vadodara, India coordinates
              lng: 73.1586,
              accuracy: 5000,
              timestamp: Date.now(),
              city: 'Vadodara',
              country: 'India',
              address: 'Vadodara, India'
            };
            
            console.warn('All location strategies failed, using fallback location:', fallbackLocation);
            resolve(fallbackLocation);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000, // Reasonable timeout for GPS
          maximumAge: 0
        }
      );
    };

    // Overall timeout to prevent hanging
    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        
        // Use fallback location instead of rejecting
        const fallbackLocation: LocationData = {
          lat: 22.3321, // Vadodara, India coordinates
          lng: 73.1586,
          accuracy: 5000,
          timestamp: Date.now(),
          city: 'Vadodara',
          country: 'India',
          address: 'Vadodara, India'
        };
        
        console.warn('Location request timed out, using fallback location:', fallbackLocation);
        resolve(fallbackLocation);
      }
    }, 8000);

    // Start with cached location
    tryCachedLocation();
  });
};

// Quick location access for faster initial response with fallback
export const getQuickLocation = (): Promise<LocationData> => {
  return getCurrentLocation({
    enableHighAccuracy: false,
    timeout: 3000, // Very short timeout for quick response
    maximumAge: 600000, // Accept cached locations up to 10 minutes old
    includeCityInfo: false,
    useFallback: true // Enable fallback location
  });
};

// Enhanced getCurrentLocation with comprehensive error handling and fallback
export const getCurrentLocation = (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  includeCityInfo?: boolean;
  useFallback?: boolean;
}): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Provide fallback location if geolocation is not supported
      if (options?.useFallback !== false) {
        const fallbackLocation: LocationData = {
          lat: 22.3321, // Vadodara, India coordinates
          lng: 73.1586,
          accuracy: 5000,
          timestamp: Date.now(),
          city: 'Vadodara',
          country: 'India',
          address: 'Vadodara, India'
        };
        console.warn('Geolocation not supported, using fallback location:', fallbackLocation);
        resolve(fallbackLocation);
        return;
      }
      
      const error = new Error('Geolocation is not supported by this browser.');
      toast({
        title: "Location Error",
        description: error.message,
        variant: "destructive",
      });
      reject(error);
      return;
    }

    const geolocationOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? false, // Default to false for faster initial location
      timeout: options?.timeout ?? 15000, // Increased back to 15 seconds for better reliability
      maximumAge: options?.maximumAge ?? 300000 // Increased to 5 minutes for better caching
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          altitude: position.coords.altitude || undefined
        };

        // Only get city information if explicitly requested or if we have good accuracy
        if (options?.includeCityInfo || (position.coords.accuracy && position.coords.accuracy < 100)) {
          try {
            // Get city information asynchronously without blocking
            getCityFromCoordinates(locationData.lat, locationData.lng)
              .then(cityInfo => {
                locationData.city = cityInfo.city;
                locationData.country = cityInfo.country;
                locationData.address = cityInfo.address;
                currentLocation = locationData;
              })
              .catch(error => {
                console.error('Error getting city info:', error);
                // Fallback to simple city detection
                locationData.city = getSimpleCityName(locationData.lat, locationData.lng);
                locationData.country = getCountryFromCity(locationData.city);
                locationData.address = `${locationData.city}, ${locationData.country}`;
                currentLocation = locationData;
              });
          } catch (error) {
            console.error('Error getting city info:', error);
            // Fallback to simple city detection
            locationData.city = getSimpleCityName(locationData.lat, locationData.lng);
            locationData.country = getCountryFromCity(locationData.city);
            locationData.address = `${locationData.city}, ${locationData.country}`;
          }
        } else {
          // Use simple city detection for faster response
          locationData.city = getSimpleCityName(locationData.lat, locationData.lng);
          locationData.country = getCountryFromCity(locationData.city);
          locationData.address = `${locationData.city}, ${locationData.country}`;
        }

        currentLocation = locationData;
        resolve(locationData);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location.';
        let shouldUseFallback = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access in your browser settings.';
            shouldUseFallback = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is currently unavailable. Please try again.';
            shouldUseFallback = true;
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please check your connection and try again.';
            shouldUseFallback = true;
            break;
        }
        
        // Use fallback location if enabled and error is recoverable
        if (shouldUseFallback && options?.useFallback !== false) {
          const fallbackLocation: LocationData = {
            lat: 22.3321, // Vadodara, India coordinates
            lng: 73.1586,
            accuracy: 5000,
            timestamp: Date.now(),
            city: 'Vadodara',
            country: 'India',
            address: 'Vadodara, India'
          };
          
          console.warn('GPS failed, using fallback location:', fallbackLocation);
          console.warn('Location error:', errorMessage);
          
          // Show a warning toast instead of error
          toast({
            title: "Location Warning",
            description: `${errorMessage} Using approximate location.`,
            variant: "default",
          });
          
          currentLocation = fallbackLocation;
          resolve(fallbackLocation);
          return;
        }
        
        const locationError = new Error(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        reject(locationError);
      },
      geolocationOptions
    );
  });
};

// Enhanced city detection with Mapbox integration
export const getCityFromCoordinates = async (lat: number, lng: number): Promise<{ city: string; country: string; address: string }> => {
  try {
    // Try Mapbox geocoding first
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=place,locality&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const city = feature.text || feature.place_name?.split(',')[0] || 'Unknown City';
          const country = feature.context?.find((ctx: any) => ctx.id.startsWith('country'))?.text || 'Unknown Country';
          
          return {
            city,
            country,
            address: feature.place_name || `${city}, ${country}`
          };
        }
      }
    }
  } catch (error) {
    console.error('Mapbox geocoding failed:', error);
  }

  // Fallback to simple city detection
  const city = getSimpleCityName(lat, lng);
  const country = getCountryFromCity(city);
  
  return {
    city,
    country,
    address: `${city}, ${country}`
  };
};

// Simple city detection as fallback
const getSimpleCityName = (lat: number, lng: number): string => {
  if (lat >= 22.2 && lat <= 22.4 && lng >= 73.1 && lng <= 73.2) {
    return 'Vadodara';
  }
  if (lat >= 19.0 && lat <= 19.2 && lng >= 72.8 && lng <= 73.0) {
    return 'Mumbai';
  }
  if (lat >= 28.6 && lat <= 28.8 && lng >= 77.1 && lng <= 77.3) {
    return 'New Delhi';
  }
  if (lat >= 40.7 && lat <= 40.8 && lng >= -74.0 && lng <= -74.1) {
    return 'New York';
  }
  if (lat >= 51.5 && lat <= 51.6 && lng >= -0.1 && lng <= -0.2) {
    return 'London';
  }
  return 'Your City';
};

// Helper function to get country from city
const getCountryFromCity = (city: string): string => {
  const cityCountryMap: { [key: string]: string } = {
    'Vadodara': 'India',
    'Mumbai': 'India',
    'New Delhi': 'India',
    'New York': 'United States',
    'London': 'United Kingdom',
    'Your City': 'Unknown'
  };
  
  return cityCountryMap[city] || 'Unknown';
};

// Start real-time location tracking
export const startLocationTracking = (
  onLocationUpdate: (location: LocationData) => void,
  onError: (error: Error) => void,
  options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    trackInSupabase?: boolean;
  } = {}
): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (isTracking) {
      reject(new Error('Location tracking is already active.'));
      return;
    }

  if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser.');
      onError(error);
      reject(error);
      return;
    }

    const trackingOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 30000
    };

    locationWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      const locationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          altitude: position.coords.altitude || undefined
      };

      try {
        // Get city information
        const cityInfo = await getCityFromCoordinates(locationData.lat, locationData.lng);
        locationData.city = cityInfo.city;
        locationData.country = cityInfo.country;
        locationData.address = cityInfo.address;
      } catch (error) {
        console.error('Error getting city info:', error);
        // Fallback to simple city detection
        locationData.city = getSimpleCityName(locationData.lat, locationData.lng);
          locationData.country = getCountryFromCity(locationData.city);
          locationData.address = `${locationData.city}, ${locationData.country}`;
      }

        currentLocation = locationData;
      onLocationUpdate(locationData);

        // Track in Supabase if enabled
        if (options.trackInSupabase) {
          await trackLocationInSupabase(locationData);
        }
    },
    (error) => {
        let errorMessage = 'Location tracking failed.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        const locationError = new Error(errorMessage);
        onError(locationError);
        isTracking = false;
      },
      trackingOptions
    );

    isTracking = true;
    resolve(locationWatchId);
  });
};

// Stop location tracking
export const stopLocationTracking = (): void => {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
    isTracking = false;
  }
};

// Get current tracking status
export const getTrackingStatus = (): { isTracking: boolean; watchId: number | null } => {
  return {
    isTracking,
    watchId: locationWatchId
  };
};

// Get last known location
export const getLastKnownLocation = (): LocationData | null => {
  return currentLocation;
};

// Track location in Supabase
export const trackLocationInSupabase = async (locationData: LocationData): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user for location tracking');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        latitude: locationData.lat,
        longitude: locationData.lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error tracking location in Supabase:', error);
    }
  } catch (error) {
    console.error('Error tracking location in Supabase:', error);
  }
};

// Share emergency location
export const shareEmergencyLocation = async (
  emergencyId: string,
  locationData: LocationData
): Promise<EmergencyLocation> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const emergencyLocation: Omit<EmergencyLocation, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      emergency_id: emergencyId,
      lat: locationData.lat,
      lng: locationData.lng,
      accuracy: locationData.accuracy,
      timestamp: locationData.timestamp,
      city: locationData.city,
      country: locationData.country,
      address: locationData.address,
      speed: locationData.speed,
      heading: locationData.heading,
      altitude: locationData.altitude,
      is_active: true
    };

    const { data, error } = await supabase
      .from('emergency_locations')
      .insert(emergencyLocation)
      .select()
      .single();

    if (error) {
      throw error;
    }

    toast({
      title: "Location Shared",
      description: "Your emergency location has been shared with responders.",
    });

    return data;
  } catch (error) {
    console.error('Error sharing emergency location:', error);
    toast({
      title: "Location Share Failed",
      description: "Failed to share your emergency location. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

// Get emergency locations for an emergency
export const getEmergencyLocations = async (emergencyId: string): Promise<EmergencyLocation[]> => {
  try {
    const { data, error } = await supabase
      .from('emergency_locations')
      .select('*')
      .eq('emergency_id', emergencyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching emergency locations:', error);
    throw error;
  }
};

// Update emergency location
export const updateEmergencyLocation = async (
  locationId: string,
  updates: Partial<EmergencyLocation>
): Promise<EmergencyLocation> => {
  try {
    const { data, error } = await supabase
      .from('emergency_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating emergency location:', error);
    throw error;
  }
};

// Deactivate emergency location
export const deactivateEmergencyLocation = async (locationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('emergency_locations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deactivating emergency location:', error);
    throw error;
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearby responders
export const findNearbyResponders = async (
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'responder')
      .eq('status', 'available');

    if (error) {
      throw error;
    }

    // Filter responders within radius
    const nearbyResponders = data?.filter(responder => {
      const distance = calculateDistance(lat, lng, responder.latitude, responder.longitude);
      return distance <= radiusKm;
    }) || [];

    // Sort by distance
    return nearbyResponders.sort((a, b) => {
      const distanceA = calculateDistance(lat, lng, a.latitude, a.longitude);
      const distanceB = calculateDistance(lat, lng, b.latitude, b.longitude);
      return distanceA - distanceB;
    });
  } catch (error) {
    console.error('Error finding nearby responders:', error);
    throw error;
  }
};

// Get location history for a user
export const getLocationHistory = async (
  userId: string,
  limit: number = 100
): Promise<LocationData[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, latitude, longitude, updated_at')
      .eq('id', userId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data?.map(loc => ({
      lat: loc.latitude,
      lng: loc.longitude,
      timestamp: new Date(loc.updated_at).getTime()
    })) || [];
  } catch (error) {
    console.error('Error fetching location history:', error);
    throw error;
  }
};

// Clear location history for a user
export const clearLocationHistory = async (userId: string): Promise<void> => {
  try {
    // Note: We don't delete user location data, just clear location fields
    const { error } = await supabase
      .from('users')
      .update({
        latitude: null,
        longitude: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    toast({
      title: "History Cleared",
      description: "Your location history has been cleared.",
    });
  } catch (error) {
    console.error('Error clearing location history:', error);
    toast({
      title: "Clear Failed",
      description: "Failed to clear location history. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

// Export legacy functions for backward compatibility
export const watchLocation = startLocationTracking;
export const stopWatchingLocation = stopLocationTracking;
