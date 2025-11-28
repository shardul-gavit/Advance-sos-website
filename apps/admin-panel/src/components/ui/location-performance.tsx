import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, Wifi, Gps, Zap } from 'lucide-react';

interface LocationPerformanceProps {
  className?: string;
  onLocationRequest?: () => void;
}

interface PerformanceMetrics {
  initialAccessTime: number;
  accuracy: number;
  locationSource: 'gps' | 'network' | 'cached';
  timestamp: number;
  strategy: string;
}

const LocationPerformance: React.FC<LocationPerformanceProps> = ({ 
  className,
  onLocationRequest 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const getPerformanceColor = (time: number) => {
    if (time < 1000) return 'text-green-400';
    if (time < 3000) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 10) return 'text-green-400';
    if (accuracy < 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gps':
        return <Gps className="w-4 h-4" />;
      case 'network':
        return <Wifi className="w-4 h-4" />;
      case 'cached':
        return <Clock className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'gps':
        return 'text-green-400';
      case 'network':
        return 'text-blue-400';
      case 'cached':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setStartTime(Date.now());
    if (onLocationRequest) {
      onLocationRequest();
    }
  };

  const updateMetrics = (accessTime: number, accuracy: number, source: string, strategy: string) => {
    setMetrics({
      initialAccessTime: accessTime,
      accuracy,
      locationSource: source as 'gps' | 'network' | 'cached',
      timestamp: Date.now(),
      strategy
    });
    setIsMonitoring(false);
  };

  return (
    <Card className={`bg-gray-900/50 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Location Performance
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor location access speed and accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMonitoring && (
          <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-300">Getting Location...</p>
              <p className="text-xs text-gray-400">
                {startTime ? `${Math.round((Date.now() - startTime) / 1000)}s elapsed` : 'Starting...'}
              </p>
            </div>
          </div>
        )}

        {metrics ? (
          <>
            {/* Access Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Access Time</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${getPerformanceColor(metrics.initialAccessTime)} border-current`}
              >
                {metrics.initialAccessTime}ms
              </Badge>
            </div>

            {/* Strategy Used */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">Strategy</span>
              </div>
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                {metrics.strategy}
              </Badge>
            </div>

            {/* Accuracy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Accuracy</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getAccuracyColor(metrics.accuracy)} border-current`}
                >
                  ±{Math.round(metrics.accuracy)}m
                </Badge>
              </div>
              <Progress 
                value={Math.min(100, (100 - metrics.accuracy) / 100 * 100)} 
                className="h-2"
              />
            </div>

            {/* Location Source */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSourceIcon(metrics.locationSource)}
                <span className="text-sm text-gray-300">Source</span>
              </div>
              <Badge 
                variant="outline" 
                className={`${getSourceColor(metrics.locationSource)} border-current capitalize`}
              >
                {metrics.locationSource}
              </Badge>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 text-sm">No performance data available</div>
            <div className="text-gray-500 text-xs mt-1">Click "Test Location" to start monitoring</div>
          </div>
        )}

        {/* Test Button */}
        <button
          onClick={startMonitoring}
          disabled={isMonitoring}
          className="w-full p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all"
        >
          {isMonitoring ? 'Testing...' : 'Test Location Speed'}
        </button>

        {/* Performance Tips */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-300 mb-2">Performance Tips:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Enable GPS for better accuracy</li>
            <li>• Check internet connection for faster geocoding</li>
            <li>• Allow location caching for quicker access</li>
            <li>• Use high-accuracy mode only when needed</li>
            <li>• Clear browser cache if location is slow</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPerformance; 