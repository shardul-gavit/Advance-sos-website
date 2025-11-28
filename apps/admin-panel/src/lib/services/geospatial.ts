import { supabase } from '../supabase';
import * as turf from '@turf/turf';
import { 
  Zone, 
  GeoSweep, 
  RouteInfo, 
  IsochroneZone, 
  ClusterInfo, 
  EmergencyZoneStats,
  GeoSweepConfig,
  ClusteringConfig
} from '@/types/geospatial';

export class GeospatialService {
  private static readonly MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  private static readonly MAPBOX_BASE_URL = 'https://api.mapbox.com';

  // Zone Management
  static async getZones(): Promise<{ zones: Zone[]; error: any }> {
    try {
      const { data: zones, error } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return { zones: zones || [], error };
    } catch (error) {
      return { zones: [], error };
    }
  }

  static async createZone(zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at'>): Promise<{ zone: Zone | null; error: any }> {
    try {
      const { data: zone, error } = await supabase
        .from('zones')
        .insert([zoneData])
        .select()
        .single();

      return { zone, error };
    } catch (error) {
      return { zone: null, error };
    }
  }

  static async updateZone(id: string, updates: Partial<Zone>): Promise<{ zone: Zone | null; error: any }> {
    try {
      const { data: zone, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { zone, error };
    } catch (error) {
      return { zone: null, error };
    }
  }

  static async deleteZone(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // GeoSweep Analysis
  static createGeoSweep(center: [number, number], radius: number, color: string = '#ff0000'): GeoSweep {
    const circle = turf.circle(center, radius / 1000, { units: 'kilometers' });
    
    return {
      id: `sweep-${Date.now()}`,
      center,
      radius,
      color,
      zoneName: `Sweep ${radius}m`,
    };
  }

  static async getRespondersInSweep(sweep: GeoSweep): Promise<{ count: number; responders: any[]; error: any }> {
    try {
      const circle = turf.circle(sweep.center, sweep.radius / 1000, { units: 'kilometers' });
      const bbox = turf.bbox(circle);

      const { data: responders, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_type', 'responder')
        .gte('latitude', bbox[1])
        .lte('latitude', bbox[3])
        .gte('longitude', bbox[0])
        .lte('longitude', bbox[2])
        .eq('status', 'available');

      if (error) {
        // Suppress 404 errors for missing tables (table doesn't exist)
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          // Table doesn't exist, return empty array silently
          return { count: 0, responders: [], error: null };
        }
        // For other errors, return empty array
        return { count: 0, responders: [], error };
      }

      // Filter responders within the actual circle
      const respondersInCircle = responders?.filter(responder => {
        const point = turf.point([responder.longitude, responder.latitude]);
        return turf.booleanPointInPolygon(point, circle);
      }) || [];

      return { 
        count: respondersInCircle.length, 
        responders: respondersInCircle, 
        error: null 
      };
    } catch (error) {
      // Suppress errors for missing tables
      return { count: 0, responders: [], error: null };
    }
  }

  // Routing & ETA
  static async getRoute(origin: [number, number], destination: [number, number]): Promise<{ route: RouteInfo | null; error: any }> {
    try {
      const url = `${this.MAPBOX_BASE_URL}/directions/v5/mapbox/driving/${origin.join(',')};${destination.join(',')}?access_token=${this.MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to get route');

      const route = data.routes[0];
      const polyline = route.geometry.coordinates;

      const routeInfo: RouteInfo = {
        id: `route-${Date.now()}`,
        origin,
        destination,
        distance: route.distance / 1000, // Convert to km
        duration: Math.round(route.duration / 60), // Convert to minutes
        polyline,
      };

      return { route: routeInfo, error: null };
    } catch (error) {
      return { route: null, error };
    }
  }

  // Isochrone Analysis
  static async getIsochrones(center: [number, number], timeRanges: number[] = [5, 10]): Promise<{ isochrones: IsochroneZone | null; error: any }> {
    try {
      const url = `${this.MAPBOX_BASE_URL}/isochrone/v1/mapbox/driving/${center.join(',')}?access_token=${this.MAPBOX_ACCESS_TOKEN}&contours_minutes=${timeRanges.join(',')}&polygons=true&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to get isochrones');

      const isochroneZone: IsochroneZone = {
        id: `isochrone-${Date.now()}`,
        center,
        timeRanges,
        colors: ['#ff0000', '#00ff00'],
        geojson: data,
      };

      return { isochrones: isochroneZone, error: null };
    } catch (error) {
      return { isochrones: null, error };
    }
  }

  // Marker Clustering
  static createClusters(points: any[], config: ClusteringConfig): ClusterInfo[] {
    if (!config.enabled) return [];

    const clusters: ClusterInfo[] = [];
    const maxDistance = config.radius; // meters

    points.forEach(point => {
      let addedToCluster = false;

      for (const cluster of clusters) {
        const distance = turf.distance(
          turf.point(cluster.coordinates),
          turf.point([point.longitude, point.latitude]),
          { units: 'meters' }
        );

        if (distance <= maxDistance) {
          cluster.points.push(point);
          cluster.pointCount++;
          
          // Update cluster type
          if (cluster.type === 'mixed') {
            // Already mixed, no change needed
          } else if (cluster.type !== point.type) {
            cluster.type = 'mixed';
            cluster.color = config.colors.mixed;
          }
          
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          id: `cluster-${Date.now()}-${Math.random()}`,
          coordinates: [point.longitude, point.latitude],
          pointCount: 1,
          type: point.type,
          color: config.colors[point.type] || config.colors.mixed,
          points: [point],
        });
      }
    });

    return clusters.filter(cluster => cluster.pointCount > 1);
  }

  // Emergency Zone Statistics
  static async getZoneStats(zoneId: string): Promise<{ stats: EmergencyZoneStats | null; error: any }> {
    try {
      // Get zone details
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .eq('id', zoneId)
        .single();

      if (zoneError) throw zoneError;

      // Get zone geometry
      const zoneGeometry = zone.geojson.geometry;
      const bbox = turf.bbox(zone.geojson);

      // Get data within bounding box
      const [sosRes, helpersRes, respondersRes] = await Promise.all([
        supabase
          .from('sos_alerts')
          .select('*')
          .gte('latitude', bbox[1])
          .lte('latitude', bbox[3])
          .gte('longitude', bbox[0])
          .lte('longitude', bbox[2])
          .eq('status', 'active')
          .order('triggered_at', { ascending: false }),
        supabase
          .from('users')
          .select('*')
          .eq('user_type', 'helper')
          .gte('latitude', bbox[1])
          .lte('latitude', bbox[3])
          .gte('longitude', bbox[0])
          .lte('longitude', bbox[2])
          .eq('status', 'available'),
        supabase
          .from('users')
          .select('*')
          .eq('user_type', 'responder')
          .gte('latitude', bbox[1])
          .lte('latitude', bbox[3])
          .gte('longitude', bbox[0])
          .lte('longitude', bbox[2])
          .eq('status', 'available'),
      ]);

      // Handle errors gracefully for missing tables
      const sosData = sosRes.error && (sosRes.error.code === '42P01' || sosRes.error.message?.includes('does not exist') || sosRes.error.message?.includes('404')) 
        ? [] 
        : (sosRes.data || []);
      
      const helpersData = helpersRes.error && (helpersRes.error.code === '42P01' || helpersRes.error.message?.includes('does not exist') || helpersRes.error.message?.includes('404')) 
        ? [] 
        : (helpersRes.data || []);
      
      const respondersData = respondersRes.error && (respondersRes.error.code === '42P01' || respondersRes.error.message?.includes('does not exist') || respondersRes.error.message?.includes('404')) 
        ? [] 
        : (respondersRes.data || []);

      // Filter data within actual zone geometry
      const sosInZone = sosData.filter(event => {
        const point = turf.point([event.longitude, event.latitude]);
        return turf.booleanPointInPolygon(point, zoneGeometry);
      });

      const helpersInZone = helpersData.filter(helper => {
        const point = turf.point([helper.longitude, helper.latitude]);
        return turf.booleanPointInPolygon(point, zoneGeometry);
      });

      const respondersInZone = respondersData.filter(responder => {
        const point = turf.point([responder.longitude, responder.latitude]);
        return turf.booleanPointInPolygon(point, zoneGeometry);
      });

      // Calculate average response time
      const resolvedEvents = sosInZone.filter(event => event.resolved_at);
      const averageResponseTime = resolvedEvents.length > 0 
        ? resolvedEvents.reduce((sum, event) => {
            const created = new Date(event.created_at);
            const resolved = new Date(event.resolved_at!);
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60); // minutes
          }, 0) / resolvedEvents.length
        : 0;

      const stats: EmergencyZoneStats = {
        zoneId,
        zoneName: zone.name,
        activeSOSCases: sosInZone.length,
        availableHelpers: helpersInZone.length,
        assignedResponders: respondersInZone.length,
        averageResponseTime: Math.round(averageResponseTime),
        lastUpdated: new Date().toISOString(),
      };

      return { stats, error: null };
    } catch (error) {
      return { stats: null, error };
    }
  }

  // Utility functions
  static calculateDistance(point1: [number, number], point2: [number, number]): number {
    return turf.distance(
      turf.point(point1),
      turf.point(point2),
      { units: 'kilometers' }
    );
  }

  static isPointInPolygon(point: [number, number], polygon: any): boolean {
    return turf.booleanPointInPolygon(turf.point(point), polygon);
  }

  static createBoundingBox(points: [number, number][]): [number, number, number, number] {
    return turf.bbox(turf.featureCollection(points.map(p => turf.point(p))));
  }

  // Subscribe to zone changes
  static subscribeToZones(callback: (payload: any) => void) {
    return supabase
      .channel('zones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, callback)
      .subscribe();
  }
} 