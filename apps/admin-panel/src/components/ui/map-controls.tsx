import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  Compass, 
  MapPin, 
  RotateCcw, 
  Wifi, 
  Satellite,
  AlertCircle,
  CheckCircle,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapControlsProps {
  onGPSRecenter: () => Promise<void>;
  onCompassReset: () => void;
  onMapStyleToggle?: () => void;
  mapRotation: number;
  isLocationLoading: boolean;
  locationAccuracy?: number;
  hasLocationPermission: boolean;
  currentMapStyle?: 'satellite' | 'default';
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({
  onGPSRecenter,
  onCompassReset,
  onMapStyleToggle,
  mapRotation,
  isLocationLoading,
  locationAccuracy,
  hasLocationPermission,
  currentMapStyle = 'satellite',
  className = ''
}) => {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showAccuracy, setShowAccuracy] = useState(false);
  const accuracyTimeoutRef = useRef<NodeJS.Timeout>();

  const handleGPSRecenter = async () => {
    if (!hasLocationPermission) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('loading');
    try {
      await onGPSRecenter();
      setGpsStatus('success');
      
      // Show accuracy briefly
      setShowAccuracy(true);
      if (accuracyTimeoutRef.current) {
        clearTimeout(accuracyTimeoutRef.current);
      }
      accuracyTimeoutRef.current = setTimeout(() => {
        setShowAccuracy(false);
      }, 3000);
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setGpsStatus('idle');
      }, 2000);
    } catch (error) {
      setGpsStatus('error');
      setTimeout(() => {
        setGpsStatus('idle');
      }, 3000);
    }
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-gray-400';
    if (accuracy < 10) return 'text-green-400';
    if (accuracy < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyIcon = (accuracy?: number) => {
    if (!accuracy) return <Wifi className="w-3 h-3" />;
    if (accuracy < 10) return <Satellite className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  useEffect(() => {
    return () => {
      if (accuracyTimeoutRef.current) {
        clearTimeout(accuracyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`absolute top-4 right-4 z-10 space-y-3 ${className}`}>
      {/* GPS Recenter Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={handleGPSRecenter}
          disabled={isLocationLoading || gpsStatus === 'loading'}
          className={`
            relative w-12 h-12 rounded-full shadow-lg border-2
            ${gpsStatus === 'idle' ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : ''}
            ${gpsStatus === 'loading' ? 'bg-blue-600 border-blue-500' : ''}
            ${gpsStatus === 'success' ? 'bg-green-600 border-green-500' : ''}
            ${gpsStatus === 'error' ? 'bg-red-600 border-red-500' : ''}
            ${!hasLocationPermission ? 'bg-gray-600 border-gray-500 cursor-not-allowed' : ''}
            transition-all duration-300
          `}
          title="GPS Recenter"
        >
          <AnimatePresence mode="wait">
            {gpsStatus === 'loading' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                <Navigation className="w-5 h-5 text-white" />
              </motion.div>
            ) : gpsStatus === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckCircle className="w-5 h-5 text-white" />
              </motion.div>
            ) : gpsStatus === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Navigation className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Accuracy Badge */}
        <AnimatePresence>
          {showAccuracy && locationAccuracy && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 right-0"
            >
              <Badge 
                variant="outline" 
                className={`${getAccuracyColor(locationAccuracy)} border-current bg-gray-900/80 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-1">
                  {getAccuracyIcon(locationAccuracy)}
                  <span className="text-xs">±{Math.round(locationAccuracy)}m</span>
                </div>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Map Style Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Button
          onClick={onMapStyleToggle}
          className={`
            relative w-12 h-12 rounded-full shadow-lg border-2 transition-all duration-300
            ${currentMapStyle === 'satellite' 
              ? 'bg-orange-600 hover:bg-orange-700 border-orange-500' 
              : 'bg-blue-600 hover:bg-blue-700 border-blue-500'
            }
          `}
          title={currentMapStyle === 'satellite' ? 'Switch to Default Map' : 'Switch to Satellite Map'}
        >
          <AnimatePresence mode="wait">
            {currentMapStyle === 'satellite' ? (
              <motion.div
                key="satellite"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Satellite className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                <Map className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Map Style Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 right-0"
        >
          <Badge 
            variant="outline" 
            className={`
              border-current bg-gray-900/80 backdrop-blur-sm text-xs
              ${currentMapStyle === 'satellite' 
                ? 'text-orange-400 border-orange-400' 
                : 'text-blue-400 border-blue-400'
              }
            `}
          >
            <div className="flex items-center gap-1">
              {currentMapStyle === 'satellite' ? (
                <Satellite className="w-3 h-3" />
              ) : (
                <Map className="w-3 h-3" />
              )}
              <span>{currentMapStyle === 'satellite' ? 'Satellite' : 'Default'}</span>
            </div>
          </Badge>
        </motion.div>
      </motion.div>

      {/* Direction Compass */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button
          onClick={onCompassReset}
          className="relative w-12 h-12 rounded-full shadow-lg bg-gray-900/80 hover:bg-gray-800/80 border border-gray-600 backdrop-blur-sm"
          title="Reset to North"
        >
          <div className="relative w-6 h-6">
            {/* Compass Background */}
            <div className="absolute inset-0 rounded-full border-2 border-gray-400 bg-gray-800/50"></div>
            
            {/* Compass Needle */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: -mapRotation }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-0.5 h-4 bg-red-500 rounded-full shadow-sm"></div>
            </motion.div>
            
            {/* North Indicator */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-0.5">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
            </div>
            
            {/* Direction Labels */}
            <div className="absolute inset-0 text-[6px] font-bold text-gray-300">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">N</div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">S</div>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2">W</div>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">E</div>
            </div>
          </div>
        </Button>

        {/* Rotation Indicator */}
        {mapRotation !== 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-14 right-0"
          >
            <Badge 
              variant="outline" 
              className="text-blue-400 border-blue-400 bg-gray-900/80 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />
                <span className="text-xs">{Math.abs(Math.round(mapRotation))}°</span>
              </div>
            </Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Permission Status Indicator */}
      {!hasLocationPermission && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="absolute top-14 right-0"
        >
          <Badge 
            variant="outline" 
            className="text-yellow-400 border-yellow-400 bg-gray-900/80 backdrop-blur-sm"
          >
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">No GPS</span>
            </div>
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

export default MapControls; 