import React, { useState, useEffect } from 'react';
import Particles from '@/components/ui/particles';
import NeuralNetwork from '@/components/ui/neural-network';
import HolographicCard from '@/components/ui/holographic-card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '@/contexts/LocationContext';
import LocationPermission from '@/components/ui/location-permission';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const navigate = useNavigate();
  const { userLocation, isLoading, error, hasPermission, requestLocationPermission } = useLocation();
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  useEffect(() => {
    // Always show location permission dialog when app loads
    // This ensures users are always prompted for location access
    setShowLocationPermission(true);
  }, []); // Empty dependency array - runs only once on mount

  useEffect(() => {
    // Show map preview when location is available
    if (userLocation) {
      setShowMapPreview(true);
    }
  }, [userLocation]);

  const handleGrantPermission = async () => {
    await requestLocationPermission();
    setShowLocationPermission(false);
  };

  const handleSkipLocation = () => {
    setShowLocationPermission(false);
  };

  const getCityName = (lat: number, lng: number) => {
    // Use the city from location data if available, otherwise fallback to coordinate-based detection
    if (userLocation?.city) {
      return userLocation.city;
    }
    
    // Simple city detection based on coordinates
    if (lat >= 22.2 && lat <= 22.4 && lng >= 73.1 && lng <= 73.2) {
      return 'Vadodara, India';
    }
    if (lat >= 19.0 && lat <= 19.2 && lng >= 72.8 && lng <= 73.0) {
      return 'Mumbai, India';
    }
    if (lat >= 28.6 && lat <= 28.8 && lng >= 77.1 && lng <= 77.3) {
      return 'New Delhi, India';
    }
    return 'Your City';
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      <Particles count={100} />
      <NeuralNetwork nodes={32} />
      
      {/* Location Permission Dialog */}
      {showLocationPermission && (
        <LocationPermission
          onGrantPermission={handleGrantPermission}
          onSkip={handleSkipLocation}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Main Content */}
      <div className="z-10 max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Welcome Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <HolographicCard className="h-full">
              <div className="flex flex-col items-start gap-6 p-8">
                <h1 className="text-4xl font-extrabold bg-gradient-to-br from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-2">
                  World-Class SOS Admin Panel
                </h1>
                <p className="text-lg text-gray-300 mb-6">
                  Experience the future of emergency management with AI, real-time 3D, and next-gen UI. 
                  Built for speed, clarity, and control.
                </p>
                
                {/* Location Status */}
                {userLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <MapPin className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-300">
                        {getCityName(userLocation.lat, userLocation.lng)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </p>
                      {userLocation.accuracy && (
                        <p className="text-xs text-gray-500">
                          Accuracy: ±{Math.round(userLocation.accuracy)}m
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:scale-105 transition-transform flex-1"
                    onClick={() => navigate('/admin')}
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    Enter Admin Panel
                  </Button>
                  
                  {!userLocation && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500/10 flex-1"
                      onClick={() => setShowLocationPermission(true)}
                    >
                      <MapPin className="w-5 h-5 mr-2" />
                      Enable Location
                    </Button>
                  )}
                </div>
              </div>
            </HolographicCard>
          </motion.div>

          {/* Right Column - Map Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {showMapPreview && userLocation ? (
              <HolographicCard className="h-96">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Interactive Map
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Mapbox integration available in Admin Panel
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">
                        {getCityName(userLocation.lat, userLocation.lng)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Live City View</p>
                  </div>
                </div>
              </HolographicCard>
            ) : (
              <HolographicCard className="h-96">
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    City Map Preview
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Enable location access to see your city map with emergency overlays
                  </p>
                  <Button
                    onClick={() => setShowLocationPermission(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Enable Location
                  </Button>
                </div>
              </HolographicCard>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;
