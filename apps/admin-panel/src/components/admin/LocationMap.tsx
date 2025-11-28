import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Plus, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { locationService, Location } from '@/lib/supabase';
import { useLocation } from '@/contexts/LocationContext';
import { getUltraFastLocation } from '@/services/locationService';
import MapControls from '@/components/ui/map-controls';

// Mapbox access token
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaHZtcCIsImEiOiJjbWN6MWk0OXQwdGM4MmtzMzZ4em5zNWFjIn0.bS5vNy8djudidIdQ6yYUdw';

interface LocationMapProps {
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ className }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mapRotation, setMapRotation] = useState(0);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const mapRef = useRef<any>(null);
  
  // Location context
  const { userLocation, hasPermission, requestLocationPermission } = useLocation();

  // GPS Recenter function
  const handleGPSRecenter = async () => {
    setIsLocationLoading(true);
    try {
      const location = await getUltraFastLocation();
      
      // Fly to user location
      if (mapRef.current && location) {
        mapRef.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 15,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('GPS recenter failed:', error);
      throw error;
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Compass reset function
  const handleCompassReset = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        bearing: 0,
        duration: 1000
      });
    }
  };

  // Handle map rotation
  const handleMapRotate = (event: any) => {
    setMapRotation(event.viewState.bearing || 0);
  };

  // Load locations from Supabase
  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await locationService.fetchLocations();
      setLocations(data);
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error loading locations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new location
  const addLocation = useCallback(async (latitude: number, longitude: number) => {
    const success = await locationService.insertLocation('Clicked Location', latitude, longitude);
    if (success) {
      setSuccessMessage('Location added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError('Failed to add location');
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  // Add sample location
  const addSampleLocation = useCallback(async () => {
    const success = await locationService.insertSampleLocation();
    if (success) {
      setSuccessMessage('Sample location added!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError('Failed to add sample location');
      setTimeout(() => setError(null), 3000);
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    addLocation(lat, lng);
  }, [addLocation]);

  // Setup real-time subscription
  useEffect(() => {
    loadLocations();

    // Subscribe to real-time updates
    const subscription = locationService.subscribeToLocations((newLocations) => {
      setLocations(newLocations);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadLocations]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Location Management</h2>
          <p className="text-gray-400">Interactive map with Supabase integration</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={loadLocations} 
            disabled={isLoading}
            variant="outline"
            className="border-sos-red text-sos-red hover:bg-sos-red hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={addSampleLocation}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sample
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-700">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-300">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Map Container */}
      <Card className="bg-gray-900 border-gray-700 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white">Interactive Map</CardTitle>
          <CardDescription className="text-gray-400">
            Click anywhere on the map to add a new location
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative h-96 w-full">
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sos-red"></div>
                  <p className="text-white text-sm">Loading locations...</p>
                </div>
              </div>
            )}
            
            <Map
              ref={mapRef}
              mapLib={import('mapbox-gl')}
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              initialViewState={{
                longitude: userLocation?.lng || -74.0060,
                latitude: userLocation?.lat || 40.7128,
                zoom: 10
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              onClick={handleMapClick}
              onMove={handleMapRotate}
              dragRotate={true}
            >
              {/* Custom Map Controls */}
              <MapControls
                onGPSRecenter={handleGPSRecenter}
                onCompassReset={handleCompassReset}
                mapRotation={mapRotation}
                isLocationLoading={isLocationLoading}
                locationAccuracy={userLocation?.accuracy}
                hasLocationPermission={hasPermission}
              />

              {/* Navigation Control (moved to bottom-right) */}
              <NavigationControl position="bottom-right" />

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  longitude={userLocation.lng}
                  latitude={userLocation.lat}
                  anchor="center"
                >
                  <div className="relative">
                    {/* User location indicator */}
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Accuracy ring */}
                    {userLocation.accuracy && (
                      <div 
                        className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-ping"
                        style={{
                          width: `${Math.max(20, userLocation.accuracy / 2)}px`,
                          height: `${Math.max(20, userLocation.accuracy / 2)}px`,
                          marginLeft: `-${Math.max(10, userLocation.accuracy / 4)}px`,
                          marginTop: `-${Math.max(10, userLocation.accuracy / 4)}px`
                        }}
                      />
                    )}
                  </div>
                </Marker>
              )}

              {/* Location Markers */}
              {locations.map((location) => (
                <Marker
                  key={location.id}
                  longitude={location.longitude}
                  latitude={location.latitude}
                  anchor="bottom"
                >
                  <div className="relative group">
                    <div className="w-6 h-6 bg-sos-red rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                      <div className="font-semibold">{location.name}</div>
                      <div className="text-gray-400 text-xs">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(location.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>
          </div>
        </CardContent>
      </Card>

      {/* Locations List */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Locations ({locations.length})</CardTitle>
          <CardDescription className="text-gray-400">
            All saved locations from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No locations found</p>
              <p className="text-gray-500 text-sm">Click on the map or add a sample location to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <Card key={location.id} className="bg-gray-800 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{location.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {new Date(location.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="font-mono">Lat:</span> {location.latitude.toFixed(6)}
                      </p>
                      <p className="text-gray-400">
                        <span className="font-mono">Lng:</span> {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Added: {new Date(location.created_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationMap; 