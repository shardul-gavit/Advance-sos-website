// Geospatial types for advanced Mapbox features

export interface Zone {
  id: string;
  name: string;
  description?: string;
  geojson: any;
  type: 'polygon' | 'circle' | 'rectangle';
  color: string;
  opacity: number;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeoSweep {
  id: string;
  center: [number, number]; // [longitude, latitude]
  radius: number; // in meters
  color: string;
  zoneName?: string;
  respondersCount?: number;
}

export interface RouteInfo {
  id: string;
  origin: [number, number];
  destination: [number, number];
  distance: number; // in km
  duration: number; // in minutes
  polyline: [number, number][];
  helperId?: string;
  userId?: string;
  // Advanced routing properties
  mode?: 'emergency' | 'optimal' | 'fastest' | 'shortest';
  traffic?: boolean;
  tolls?: boolean;
  alternatives?: RouteInfo[];
  segmentIndex?: number;
  waypoints?: [number, number][];
  estimatedFuel?: number; // in liters
  estimatedCost?: number; // in currency
  roadTypes?: string[]; // ['highway', 'local', 'toll']
  trafficConditions?: 'low' | 'medium' | 'high' | 'severe';
  weatherImpact?: 'none' | 'light' | 'moderate' | 'severe';
  emergencyPriority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface IsochroneZone {
  id: string;
  center: [number, number];
  timeRanges: number[]; // [5, 10] minutes
  colors: string[]; // ['#ff0000', '#00ff00']
  geojson: any;
}

export interface ClusterInfo {
  id: string;
  coordinates: [number, number];
  pointCount: number;
  type: 'sos' | 'helper' | 'responder' | 'mixed';
  color: string;
  points: any[];
}

export interface EmergencyZoneStats {
  zoneId: string;
  zoneName: string;
  activeSOSCases: number;
  availableHelpers: number;
  assignedResponders: number;
  averageResponseTime: number; // in minutes
  lastUpdated: string;
}

export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
  maxZoom: number;
  minZoom: number;
}

export interface DrawToolConfig {
  enabled: boolean;
  mode: 'draw_polygon' | 'draw_circle' | 'draw_rectangle' | null;
  styles: any[];
}

export interface GeoSweepConfig {
  enabled: boolean;
  defaultRadius: number; // in meters
  colors: {
    danger: string;
    helper: string;
    neutral: string;
  };
}

export interface ClusteringConfig {
  enabled: boolean;
  maxZoom: number;
  radius: number;
  colors: {
    sos: string;
    helper: string;
    responder: string;
    mixed: string;
  };
} 