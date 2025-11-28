import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Shield, Wifi, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LocationPermissionProps {
  onGrantPermission: () => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onGrantPermission,
  onSkip,
  isLoading = false,
  error = null,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <Card className="w-full max-w-md bg-gray-900 border-gray-700 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Location Access Required
          </CardTitle>
          <CardDescription className="text-gray-300 mt-2">
            This app requires location access for emergency services and real-time features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Wifi className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-300">Real-time Updates</p>
                <p className="text-xs text-gray-400">Get live emergency alerts in your area</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-300">City Map View</p>
                <p className="text-xs text-gray-400">See your city with emergency overlays</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-300">Privacy Protected</p>
                <p className="text-xs text-gray-400">Your location is only used for emergency services</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={onGrantPermission}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-4 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Getting Location...
                </div>
              ) : (
                'Enable Location Access'
              )}
            </Button>
            
            <Button
              onClick={onSkip}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-gray-800 py-3"
            >
              Skip for now
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              You can enable location access later in settings
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LocationPermission; 