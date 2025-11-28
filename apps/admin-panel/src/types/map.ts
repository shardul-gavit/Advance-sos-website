export interface MapConfig {
  accessToken: string;
  style: string;
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  maxZoom: number;
  minZoom: number;
  pitch: number;
  bearing: number;
}

export interface MapMarker {
  id: string;
  type: 'sos' | 'helper' | 'responder' | 'hospital' | 'user';
  latitude: number;
  longitude: number;
  data: any;
  popup?: MapPopup;
  cluster?: boolean;
}

export interface MapPopup {
  title: string;
  content: string;
  actions?: MapPopupAction[];
  showCloseButton?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface MapPopupAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
}

export interface MapFilters {
  showSOS: boolean;
  showHelpers: boolean;
  showResponders: boolean;
  showHospitals: boolean;
  showUsers: boolean;
  showRoutes: boolean;
  showClusters: boolean;
  showHeatmap: boolean;
  showMarkers: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface RouteInfo {
  distance: number; // in kilometers
  duration: number; // in seconds
  polyline: [number, number][]; // coordinates for route display
  steps: RouteStep[];
  summary: RouteSummary;
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  maneuver: {
    type: string;
    location: [number, number];
  };
}

export interface RouteSummary {
  totalDistance: number;
  totalDuration: number;
  traffic: 'low' | 'medium' | 'high';
  tolls: boolean;
  ferries: boolean;
}

export interface ClusterInfo {
  id: string;
  point_count: number;
  coordinates: [number, number];
  markers: MapMarker[];
}

export interface HeatmapData {
  latitude: number;
  longitude: number;
  intensity: number;
  radius?: number;
}

export interface MapLayer {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap';
  source: string;
  paint: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
}

export interface MapSource {
  id: string;
  type: 'geojson' | 'vector' | 'raster' | 'image';
  data?: any;
  url?: string;
  tiles?: string[];
  minzoom?: number;
  maxzoom?: number;
}

export interface MapEvent {
  type: string;
  target: any;
  point: [number, number];
  lngLat: [number, number];
  features?: any[];
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  preview?: string;
  dark?: boolean;
}

export const MAPBOX_STYLES: MapStyle[] = [
  {
    id: 'dark-v11',
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    dark: true,
  },
  {
    id: 'light-v11',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    dark: false,
  },
  {
    id: 'streets-v12',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    dark: false,
  },
  {
    id: 'satellite-v9',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    dark: true,
  },
  {
    id: 'satellite-streets-v12',
    name: 'Satellite Streets',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark: true,
  },
];

export const MARKER_COLORS = {
  sos: '#ff4444',
  helper: '#4444ff',
  responder: '#44ff44',
  hospital: '#ffff44',
  user: '#ff8844',
} as const;

export const MARKER_ICONS = {
  sos: '🚨',
  helper: '🆘',
  responder: '🚑',
  hospital: '🏥',
  user: '👤',
} as const;

export const MARKER_SIZES = {
  small: 20,
  medium: 30,
  large: 40,
} as const;

export interface MapControls {
  showNavigation: boolean;
  showFullscreen: boolean;
  showGeolocate: boolean;
  showScale: boolean;
  showAttribution: boolean;
}

export const DEFAULT_MAP_CONTROLS: MapControls = {
  showNavigation: true,
  showFullscreen: true,
  showGeolocate: true,
  showScale: true,
  showAttribution: true,
};

export interface MapInteraction {
  scrollZoom: boolean;
  boxZoom: boolean;
  dragRotate: boolean;
  dragPan: boolean;
  keyboard: boolean;
  doubleClickZoom: boolean;
  touchZoomRotate: boolean;
}

export const DEFAULT_MAP_INTERACTION: MapInteraction = {
  scrollZoom: true,
  boxZoom: true,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
  doubleClickZoom: true,
  touchZoomRotate: true,
}; 