import mapboxgl from 'mapbox-gl';

// Mapbox configuration and utilities
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example',
  center: [73.1812, 22.3072] as [number, number], // Vadodara, Gujarat
  zoom: 12,
  maxZoom: 18,
  minZoom: 8,
  style: 'mapbox://styles/mapbox/satellite-v9',
  darkStyle: 'mapbox://styles/mapbox/dark-v11',
  lightStyle: 'mapbox://styles/mapbox/light-v11',
  streetStyle: 'mapbox://styles/mapbox/streets-v12'
};

// Validate Mapbox configuration
export const validateMapboxConfig = () => {
  const token = MAPBOX_CONFIG.accessToken;
  
  if (!token || token === 'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example') {
    console.warn('⚠️ Mapbox access token not configured. Please set VITE_MAPBOX_ACCESS_TOKEN');
    return false;
  }
  
  if (!token.startsWith('pk.')) {
    console.warn('⚠️ Invalid Mapbox access token format');
    return false;
  }
  
  return true;
};

// Mapbox styles configuration
export const MAPBOX_STYLES = {
  satellite: MAPBOX_CONFIG.style,
  dark: MAPBOX_CONFIG.darkStyle,
  light: MAPBOX_CONFIG.lightStyle,
  street: MAPBOX_CONFIG.streetStyle
};

// Mapbox clustering configuration
export const CLUSTERING_CONFIG = {
  maxZoom: 14,
  radius: 50,
  minPoints: 2,
  maxPoints: 100
};

// Mapbox performance configuration
export const PERFORMANCE_CONFIG = {
  maxZoom: 18,
  minZoom: 8,
  maxPitch: 60,
  maxBearing: 360,
  antialias: true,
  preserveDrawingBuffer: false,
  trackResize: true,
  refreshExpiredTiles: true,
  fadeDuration: 300,
  crossSourceCollisions: true
};

// Mapbox marker configurations
export const MARKER_CONFIG = {
  sos: {
    color: '#ef4444',
    size: 'large',
    icon: '🚨'
  },
  helper: {
    color: '#22c55e',
    size: 'medium',
    icon: '🆘'
  },
  responder: {
    color: '#3b82f6',
    size: 'medium',
    icon: '🚑'
  },
  hospital: {
    color: '#8b5cf6',
    size: 'small',
    icon: '🏥'
  }
};

// Mapbox layer configurations
export const LAYER_CONFIG = {
  sosLayer: {
    id: 'sos-markers',
    type: 'circle',
    paint: {
      'circle-radius': 8,
      'circle-color': MARKER_CONFIG.sos.color,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  },
  helperLayer: {
    id: 'helper-markers',
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': MARKER_CONFIG.helper.color,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  },
  responderLayer: {
    id: 'responder-markers',
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': MARKER_CONFIG.responder.color,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  },
  hospitalLayer: {
    id: 'hospital-markers',
    type: 'circle',
    paint: {
      'circle-radius': 4,
      'circle-color': MARKER_CONFIG.hospital.color,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    }
  }
};

// Mapbox source configurations
export const SOURCE_CONFIG = {
  sosSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    },
    cluster: true,
    clusterMaxZoom: CLUSTERING_CONFIG.maxZoom,
    clusterRadius: CLUSTERING_CONFIG.radius
  },
  helperSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  },
  responderSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  },
  hospitalSource: {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  }
};

// Mapbox utility functions
export const mapboxUtils = {
  // Convert coordinates to GeoJSON feature
  createFeature: (coordinates: [number, number], properties: any = {}) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates
    },
    properties
  }),

  // Create GeoJSON collection from coordinates array
  createFeatureCollection: (features: any[]) => ({
    type: 'FeatureCollection' as const,
    features
  }),

  // Calculate distance between two points
  calculateDistance: (point1: [number, number], point2: [number, number]): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLon = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Format distance for display
  formatDistance: (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  },

  // Get bounds from coordinates array
  getBounds: (coordinates: [number, number][]): [[number, number], [number, number]] => {
    if (coordinates.length === 0) {
      return [[0, 0], [0, 0]];
    }

    let minLng = coordinates[0][0];
    let maxLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLat = coordinates[0][1];

    coordinates.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    return [[minLng, minLat], [maxLng, maxLat]];
  },

  // Validate coordinates
  isValidCoordinate: (coordinate: [number, number]): boolean => {
    const [lng, lat] = coordinate;
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
};

// Test Mapbox configuration
export const testMapboxConfiguration = () => {
  const isValid = validateMapboxConfig();
  
  console.log('Mapbox Configuration Test:');
  console.log('- Token Valid:', isValid);
  console.log('- Access Token:', MAPBOX_CONFIG.accessToken.substring(0, 20) + '...');
  console.log('- Center:', MAPBOX_CONFIG.center);
  console.log('- Zoom:', MAPBOX_CONFIG.zoom);
  
  return { isValid, config: MAPBOX_CONFIG };
};

// Export default configuration
export default MAPBOX_CONFIG; 