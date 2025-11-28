// Distance and ETA calculation service
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  eta: Date;
  route: Location[];
}

export interface DistanceMatrixResult {
  origin: Location;
  destination: Location;
  distance: number;
  duration: number;
  eta: Date;
}

export class DistanceService {
  private static readonly EARTH_RADIUS = 6371000; // Earth's radius in meters
  private static readonly GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS * c;
  }

  // Calculate ETA based on distance and average speed
  static calculateETA(distance: number, averageSpeed: number = 30): Date {
    const durationHours = distance / 1000 / averageSpeed; // Convert to hours
    const durationMinutes = durationHours * 60;
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + durationMinutes);
    return eta;
  }

  // Get detailed route information using Google Directions API
  static async getRouteInfo(origin: Location, destination: Location): Promise<RouteInfo | null> {
    if (!this.GOOGLE_API_KEY) {
      // Fallback to Haversine calculation
      const distance = this.calculateDistance(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
      );
      const eta = this.calculateETA(distance);
      
      return {
        distance,
        duration: (eta.getTime() - new Date().getTime()) / 1000,
        eta,
        route: [origin, destination]
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origin.latitude},${origin.longitude}&` +
        `destination=${destination.latitude},${destination.longitude}&` +
        `key=${this.GOOGLE_API_KEY}`
      );

      const data = await response.json();

      if (data.status !== 'OK' || !data.routes.length) {
        throw new Error(`Google Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value, // meters
        duration: leg.duration.value, // seconds
        eta: new Date(Date.now() + leg.duration.value * 1000),
        route: this.decodePolyline(route.overview_polyline.points)
      };
    } catch (error) {
      console.error('Failed to get route info:', error);
      return null;
    }
  }

  // Get distance matrix for multiple origins and destinations
  static async getDistanceMatrix(
    origins: Location[],
    destinations: Location[]
  ): Promise<DistanceMatrixResult[]> {
    if (!this.GOOGLE_API_KEY) {
      // Fallback to Haversine calculations
      return origins.flatMap(origin =>
        destinations.map(destination => {
          const distance = this.calculateDistance(
            origin.latitude, origin.longitude,
            destination.latitude, destination.longitude
          );
          const eta = this.calculateETA(distance);
          
          return {
            origin,
            destination,
            distance,
            duration: (eta.getTime() - new Date().getTime()) / 1000,
            eta
          };
        })
      );
    }

    try {
      const originStr = origins.map(loc => `${loc.latitude},${loc.longitude}`).join('|');
      const destinationStr = destinations.map(loc => `${loc.latitude},${loc.longitude}`).join('|');

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${originStr}&` +
        `destinations=${destinationStr}&` +
        `key=${this.GOOGLE_API_KEY}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API error: ${data.status}`);
      }

      const results: DistanceMatrixResult[] = [];

      data.rows.forEach((row: any, originIndex: number) => {
        row.elements.forEach((element: any, destIndex: number) => {
          if (element.status === 'OK') {
            results.push({
              origin: origins[originIndex],
              destination: destinations[destIndex],
              distance: element.distance.value,
              duration: element.duration.value,
              eta: new Date(Date.now() + element.duration.value * 1000)
            });
          }
        });
      });

      return results;
    } catch (error) {
      console.error('Failed to get distance matrix:', error);
      return [];
    }
  }

  // Find nearest helper/responder to a location
  static async findNearest(
    location: Location,
    helpers: Location[],
    responders: Location[]
  ): Promise<{
    nearestHelper?: { helper: Location; distance: number; eta: Date };
    nearestResponder?: { responder: Location; distance: number; eta: Date };
  }> {
    const allLocations = [
      ...helpers.map(h => ({ ...h, type: 'helper' as const })),
      ...responders.map(r => ({ ...r, type: 'responder' as const }))
    ];

    if (allLocations.length === 0) {
      return {};
    }

    const distances = await Promise.all(
      allLocations.map(async (loc) => {
        const routeInfo = await this.getRouteInfo(location, loc);
        return {
          location: loc,
          distance: routeInfo?.distance || this.calculateDistance(
            location.latitude, location.longitude,
            loc.latitude, loc.longitude
          ),
          eta: routeInfo?.eta || this.calculateETA(
            routeInfo?.distance || this.calculateDistance(
              location.latitude, location.longitude,
              loc.latitude, loc.longitude
            )
          )
        };
      })
    );

    const nearestHelper = distances
      .filter(d => d.location.type === 'helper')
      .sort((a, b) => a.distance - b.distance)[0];

    const nearestResponder = distances
      .filter(d => d.location.type === 'responder')
      .sort((a, b) => a.distance - b.distance)[0];

    return {
      nearestHelper: nearestHelper ? {
        helper: nearestHelper.location,
        distance: nearestHelper.distance,
        eta: nearestHelper.eta
      } : undefined,
      nearestResponder: nearestResponder ? {
        responder: nearestResponder.location,
        distance: nearestResponder.distance,
        eta: nearestResponder.eta
      } : undefined
    };
  }

  // Format distance for display
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  // Format duration for display
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Format ETA for display
  static formatETA(eta: Date): string {
    const now = new Date();
    const diff = eta.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return 'Now';
    } else if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Utility functions
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static decodePolyline(encoded: string): Location[] {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let shift = 0, result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        let b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (result >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }

    return poly;
  }
} 