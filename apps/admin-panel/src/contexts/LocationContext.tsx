import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationData, getCurrentLocation, getQuickLocation, getUltraFastLocation, alwaysRequestLocationPermission, watchLocation, stopWatchingLocation } from '@/services/locationService';

interface LocationContextType {
  userLocation: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocationPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [watchId, setWatchId] = useState<number>(-1);
  const [isInitialized, setIsInitialized] = useState(false);

  const requestLocationPermission = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading && isInitialized) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Always request permission first
      const permissionResult = await alwaysRequestLocationPermission();
      
      if (!permissionResult.granted) {
        throw new Error('Location permission denied');
      }
      
      // Use ultra-fast location strategy with fallback for immediate results
      const location = await getUltraFastLocation();
      
      setUserLocation(location);
      setHasPermission(true);
      
      // Only start watching if not already watching
      if (watchId === -1) {
        try {
          const newWatchId = await watchLocation(
          (updatedLocation) => {
            setUserLocation(updatedLocation);
          },
          (watchError) => {
            console.error('Location watch error:', watchError);
            // Don't set error for watch failures, just log them
          },
          {
            enableHighAccuracy: true, // Use high accuracy for tracking
            timeout: 10000,
              maximumAge: 30000,
              trackInSupabase: false // Don't track in Supabase from context
          }
        );
        setWatchId(newWatchId);
        } catch (trackingError) {
          // Handle "already active" error gracefully
          if (trackingError instanceof Error && trackingError.message.includes('already active')) {
            console.warn('Location tracking already active, skipping...');
            // Try to get current tracking status
            try {
              const { getTrackingStatus } = await import('@/services/locationService');
              const status = getTrackingStatus();
              if (status.watchId !== null) {
                setWatchId(status.watchId);
              }
            } catch (statusError) {
              console.warn('Could not get tracking status:', statusError);
            }
          } else {
            console.error('Failed to start location tracking:', trackingError);
            // Don't throw - just log the error so the app continues
          }
        }
      }
      
      // Get detailed city info in background after 300ms
      setTimeout(async () => {
        try {
          const detailedLocation = await getCurrentLocation({
            enableHighAccuracy: true,
            timeout: 8000,
            includeCityInfo: true
          });
          setUserLocation(detailedLocation);
        } catch (error) {
          console.log('Background city info update failed:', error);
        }
      }, 300);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      setHasPermission(false);
      
      // Set a default location (Vadodara, India) if location access is denied
      if (errorMessage.includes('denied')) {
        setUserLocation({ lat: 22.3072, lng: 73.1812 });
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const refreshLocation = async () => {
    if (hasPermission) {
      await requestLocationPermission();
    }
  };

  useEffect(() => {
    // Only request location permission once on mount
    let mounted = true;
    
    const initLocation = async () => {
      if (!isInitialized && mounted) {
        try {
          await requestLocationPermission();
        } catch (error) {
          console.error('Error initializing location:', error);
          // Set fallback location on error
          setUserLocation({ lat: 22.3072, lng: 73.1812 });
          setIsLoading(false);
        }
      }
    };
    
    initLocation();

    // Cleanup function to stop watching location
    return () => {
      mounted = false;
      if (watchId !== -1 && watchId !== null) {
        try {
          stopWatchingLocation();
        } catch (error) {
          console.warn('Error stopping location tracking:', error);
        }
      }
    };
  }, []);

  const value: LocationContextType = {
    userLocation,
    isLoading,
    error,
    hasPermission,
    requestLocationPermission: async () => {
      try {
        await requestLocationPermission();
      } catch (err) {
        console.error('Error in requestLocationPermission:', err);
        // Don't throw - just log
      }
    },
    refreshLocation: async () => {
      try {
        await refreshLocation();
      } catch (err) {
        console.error('Error in refreshLocation:', err);
        // Don't throw - just log
      }
    },
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 