import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '@/lib/mapbox';
import { MapMarker } from '@/types/sos';
import { MapFilters } from '@/types/map';
import { debounce } from 'lodash';
import { useLocation } from '@/contexts/LocationContext';
import { getUltraFastLocation } from '@/services/locationService';
import MapControls from '@/components/ui/map-controls';

interface EnhancedAdminMapProps {
  markers: MapMarker[];
  filters: MapFilters;
  onMarkerClick?: (marker: MapMarker) => void;
  mapRef?: any;
  setMapRef?: (ref: any) => void;
  mapStyle?: string;
  showClustering?: boolean;
  enableAnimations?: boolean;
}

export const EnhancedAdminMap: React.FC<EnhancedAdminMapProps> = ({
  markers,
  filters,
  onMarkerClick,
  mapRef,
  setMapRef,
  mapStyle = 'satellite',
  showClustering = true,
  enableAnimations = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const clustersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mapRotation, setMapRotation] = useState(0);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [userLocationMarker, setUserLocationMarker] = useState<mapboxgl.Marker | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<'satellite' | 'default'>(mapStyle as 'satellite' | 'default');
  
  // Location context
  const { userLocation, hasPermission } = useLocation();

  // GPS Recenter function
  const handleGPSRecenter = async () => {
    setIsLocationLoading(true);
    try {
      const location = await getUltraFastLocation();
      
      // Fly to user location
      if (map.current && location) {
        map.current.flyTo({
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
    if (map.current) {
      map.current.easeTo({
        bearing: 0,
        duration: 1000
      });
    }
  };

  // Handle map rotation
  const handleMapRotate = () => {
    if (map.current) {
      setMapRotation(map.current.getBearing());
    }
  };

  // Handle map style toggle
  const handleMapStyleToggle = () => {
    if (!map.current) return;
    
    const newStyle = currentMapStyle === 'satellite' ? 'default' : 'satellite';
    setCurrentMapStyle(newStyle);
    
    if (newStyle === 'default') {
      // Switch to default map
      map.current.setStyle('mapbox://styles/mapbox/dark-v11');
      console.log('🗺️ Switched to default map style');
    } else {
      // Switch to satellite map
      map.current.setStyle('mapbox://styles/mapbox/satellite-v9');
      console.log('🛰️ Switched to satellite map style');
    }
  };

  // Create user location marker with enhanced styling
  const createUserLocationMarker = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'user-location-marker';
    el.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      background: linear-gradient(135deg, #00ff00, #00cc00);
      border: 3px solid #ffffff;
      box-shadow: 0 0 15px rgba(0, 255, 0, 0.8), 0 0 30px rgba(0, 255, 0, 0.4);
      animation: locationPulse 2s infinite, locationRotate 4s infinite linear;
      transform: rotate(-45deg);
      cursor: pointer;
      position: relative;
      z-index: 1000;
    `;
    
    // Add inner dot
    const innerDot = document.createElement('div');
    innerDot.style.cssText = `
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    `;
    el.appendChild(innerDot);
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes locationPulse {
        0% { transform: rotate(-45deg) scale(1); opacity: 1; }
        50% { transform: rotate(-45deg) scale(1.3); opacity: 0.8; }
        100% { transform: rotate(-45deg) scale(1); opacity: 1; }
      }
      @keyframes locationRotate {
        0% { transform: rotate(-45deg); }
        100% { transform: rotate(315deg); }
      }
    `;
    document.head.appendChild(style);
    
    return el;
  }, []);

  // Update user location marker
  const updateUserLocationMarker = useCallback((location: typeof userLocation) => {
    if (!map.current || !mapLoaded) return;

    // Remove existing user location marker
    if (userLocationMarker) {
      userLocationMarker.remove();
      setUserLocationMarker(null);
    }

    if (location && location.lat && location.lng) {
      console.log('📍 Adding geolocation marker at:', location.lat, location.lng);
      console.log('📍 Map center:', map.current.getCenter());
      console.log('📍 Map zoom:', map.current.getZoom());
      
      // Validate coordinates
      if (isNaN(location.lat) || isNaN(location.lng)) {
        console.error('📍 Invalid coordinates:', location);
        return;
      }
      
      // Check if coordinates are within reasonable bounds
      if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
        console.error('📍 Coordinates out of bounds:', location);
        return;
      }
      
      const markerEl = createUserLocationMarker();
      
      // Add click event to show location info
      markerEl.addEventListener('click', () => {
        console.log('📍 Geolocation marker clicked:', location);
        // You can add a popup or notification here
      });
      
      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center'
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map.current);
      
      // Double-check the marker position
      const markerPosition = marker.getLngLat();
      console.log('📍 Marker set at coordinates:', markerPosition);
      console.log('📍 Expected coordinates:', [location.lng, location.lat]);
      
      // If the marker position doesn't match expected coordinates, try to fix it
      if (Math.abs(markerPosition.lng - location.lng) > 0.0001 || Math.abs(markerPosition.lat - location.lat) > 0.0001) {
        console.warn('📍 Marker position mismatch, repositioning...');
        marker.setLngLat([location.lng, location.lat]);
      }
      
      // Add popup with location info
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '250px'
      });
      
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-sm';
      popupContent.innerHTML = `
        <div class="space-y-2">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Your Location
          </h3>
          <div class="text-gray-600 space-y-1">
            <p><strong>Coordinates:</strong> ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</p>
            ${location.accuracy ? `<p><strong>Accuracy:</strong> ±${Math.round(location.accuracy)}m</p>` : ''}
            ${location.city ? `<p><strong>City:</strong> ${location.city}</p>` : ''}
            ${location.country ? `<p><strong>Country:</strong> ${location.country}</p>` : ''}
            <p class="text-xs text-gray-500 mt-2">Last updated: ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      `;
      
      popup.setDOMContent(popupContent);
      marker.setPopup(popup);
      
      setUserLocationMarker(marker);
      
      // Force marker to be visible by ensuring it's in the viewport
      setTimeout(() => {
        if (map.current && marker) {
          // Get the marker's current position
          const markerLngLat = marker.getLngLat();
          console.log('📍 Marker positioned at:', markerLngLat);
          
          // Ensure marker is visible in the current view
          const bounds = map.current.getBounds();
          const isVisible = bounds.contains(markerLngLat);
          
          if (!isVisible) {
            console.log('📍 Marker not visible, centering map');
            map.current.flyTo({
              center: [location.lng, location.lat],
              zoom: Math.max(map.current.getZoom(), 12),
              duration: 2000
            });
          }
        }
      }, 100);
      
      // Auto-center on user location if it's the first time or if location changed significantly
      const currentCenter = map.current.getCenter();
      const distance = Math.sqrt(
        Math.pow(currentCenter.lng - location.lng, 2) + 
        Math.pow(currentCenter.lat - location.lat, 2)
      );
      
      // If distance is more than 0.01 degrees (roughly 1km), auto-center
      if (distance > 0.01) {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: Math.max(map.current.getZoom(), 12),
          duration: 2000
        });
      }
    }
  }, [mapLoaded, userLocationMarker, createUserLocationMarker]);

  // Debounced marker update function
  const debouncedUpdateMarkers = useMemo(
    () => debounce((newMarkers: MapMarker[], newFilters: MapFilters) => {
      if (!map.current || !mapLoaded) return;
      updateMarkers(newMarkers, newFilters);
    }, 100),
    [mapLoaded]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/dark-v11',
      center: MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      pitch: 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: false,
      trackResize: true
    });

    // Add navigation controls (moved to bottom-right to make room for custom controls)
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Map load event
    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Enable 3D globe
      if (map.current) {
        map.current.setProjection('globe');
      }

      // Add clustering source if enabled
      if (showClustering) {
        addClusteringSource();
      }
    });

    // Handle map rotation
    map.current.on('rotate', handleMapRotate);
    map.current.on('move', handleMapRotate);

    // Handle map errors
    map.current.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Set map reference
    if (setMapRef) {
      setMapRef(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, showClustering, setMapRef]);

  // Add clustering source
  const addClusteringSource = () => {
    if (!map.current) return;

    // Add cluster source
    map.current.addSource('clusters', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layers
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'clusters',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'clusters',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'clusters',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Handle cluster clicks
    map.current.on('click', 'clusters', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties?.cluster_id;
      const source = map.current!.getSource('clusters') as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.current!.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom
        });
      });
    });

    // Handle unclustered point clicks
    map.current.on('click', 'unclustered-point', (e) => {
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const markerId = e.features![0].properties?.id;
      
      // Find the marker and trigger click
      const marker = markers.find(m => m.id === markerId);
      if (marker && onMarkerClick) {
        onMarkerClick(marker);
      }
    });
  };

  // Update markers with clustering
  const updateMarkers = useCallback((newMarkers: MapMarker[], newFilters: MapFilters) => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (showClustering) {
      // Update cluster source
      const source = map.current.getSource('clusters') as mapboxgl.GeoJSONSource;
      if (source) {
        const features = newMarkers
          .filter(marker => {
            const filterKey = `show${marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}` as keyof MapFilters;
            return newFilters[filterKey];
          })
          .map(marker => ({
            type: 'Feature' as const,
            properties: {
              id: marker.id,
              type: marker.type,
              ...marker.properties
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [marker.longitude, marker.latitude]
            }
          }));

        source.setData({
          type: 'FeatureCollection',
          features
        });
      }
    } else {
      // Add individual markers
      newMarkers.forEach(marker => {
        const filterKey = `show${marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}` as keyof MapFilters;
        if (!newFilters[filterKey]) return;

        const el = createMarkerElement(marker.type, marker.size || 'medium');
        
        const mapboxMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);

        // Add click event
        el.addEventListener('click', () => {
          onMarkerClick?.(marker);
        });

        // Add popup if marker has popup data
        if (marker.popup) {
          addPopupToMarker(mapboxMarker, marker.popup.title, marker.popup.content, marker.popup.actions);
        }

        markersRef.current[marker.id] = mapboxMarker;
      });
    }
  }, [mapLoaded, showClustering, onMarkerClick, markers]);

  // Create marker element
  const createMarkerElement = (type: string, size: string = 'medium') => {
    const el = document.createElement('div');
    el.className = `marker marker-${type} marker-${size}`;

    const sizeClass = size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6';
    const colorClass = type === 'sos' ? 'bg-red-500' : 
                      type === 'helper' ? 'bg-green-500' : 
                      type === 'responder' ? 'bg-blue-500' : 
                      type === 'hospital' ? 'bg-purple-500' : 'bg-gray-500';
    
    el.innerHTML = `
      <div class="${sizeClass} ${colorClass} rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
        <div class="w-2 h-2 bg-white rounded-full"></div>
      </div>
    `;
    
    return el;
  };

  // Add popup to marker
  const addPopupToMarker = (marker: mapboxgl.Marker, title: string, content: string, actions?: any[]) => {
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '300px'
    });

    const popupContent = document.createElement('div');
    popupContent.className = 'p-3';
    popupContent.innerHTML = `
      <h3 class="font-semibold text-gray-900 mb-2">${title}</h3>
      <p class="text-sm text-gray-600 mb-3">${content}</p>
      ${actions ? `
        <div class="flex gap-2">
          ${actions.map(action => `
            <button class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600" 
                    onclick="window.handleMarkerAction('${action.id}')">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    popup.setDOMContent(popupContent);
    marker.setPopup(popup);
  };

  // Earth to Map transition
  const animateToLocation = useCallback((longitude: number, latitude: number, zoom: number = 15) => {
    if (!map.current || isAnimating) return;

    setIsAnimating(true);

    // First, animate to globe view
    map.current.easeTo({
      center: [longitude, latitude],
      zoom: 2,
      duration: 2000,
      curve: 1
    });

    // Then zoom in to map view
    setTimeout(() => {
      map.current!.easeTo({
        center: [longitude, latitude],
        zoom: zoom,
        duration: 3000,
        curve: 1
      });

      setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
    }, 2000);
  }, [isAnimating]);

  // Update markers when props change
  useEffect(() => {
    debouncedUpdateMarkers(markers, filters);
  }, [markers, filters, debouncedUpdateMarkers]);

  // Update user location marker when location changes
  useEffect(() => {
    updateUserLocationMarker(userLocation);
  }, [userLocation, updateUserLocationMarker]);

  // Geolocation marker is now always visible when location is available

  // Create special SOS trigger marker
  const createSOSTriggerMarker = useCallback((marker: MapMarker) => {
    const el = document.createElement('div');
    el.className = 'sos-trigger-marker';
    el.style.cssText = `
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #ff0000;
      border: 4px solid #ffffff;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
      animation: sosPulse 1s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
      font-weight: bold;
    `;
    
    // Add SOS icon
    el.innerHTML = '🚨';
    
    // Add SOS pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sosPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return el;
  }, []);

  // Update SOS trigger markers
  const updateSOSTriggerMarkers = useCallback((markers: MapMarker[]) => {
    if (!map.current || !mapLoaded) return;

    // Clear existing SOS trigger markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker.getElement().classList.contains('sos-trigger-marker')) {
        marker.remove();
      }
    });

    // Add SOS trigger markers for active SOS events
    markers.forEach(marker => {
      if (marker.type === 'sos' && marker.properties?.status === 'active') {
        const markerEl = createSOSTriggerMarker(marker);
        const mapboxMarker = new mapboxgl.Marker(markerEl)
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map.current!);
        
        markersRef.current[`sos-${marker.id}`] = mapboxMarker;
      }
    });
  }, [mapLoaded, createSOSTriggerMarker]);

  // Update SOS trigger markers when markers change
  useEffect(() => {
    updateSOSTriggerMarkers(markers);
  }, [markers, updateSOSTriggerMarkers]);

  // Create search marker
  const createSearchMarker = useCallback((marker: MapMarker) => {
    const el = document.createElement('div');
    el.className = 'search-marker';
    el.style.cssText = `
      width: 25px;
      height: 25px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid #ffffff;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
      animation: searchPulse 2s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
    `;
    
    // Add search icon
    el.innerHTML = '🔍';
    
    // Add search pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes searchPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return el;
  }, []);

  // Update all markers including search markers
  const updateAllMarkers = useCallback((markers: MapMarker[]) => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add all markers
    markers.forEach(marker => {
      let markerEl;
      
      if (marker.type === 'sos' && marker.properties?.status === 'active') {
        markerEl = createSOSTriggerMarker(marker);
      } else if (marker.type === 'search') {
        markerEl = createSearchMarker(marker);
      } else {
        markerEl = createMarkerElement(marker.type, marker.size || 'medium');
      }
      
      const mapboxMarker = new mapboxgl.Marker(markerEl)
        .setLngLat([marker.longitude, marker.latitude])
        .addTo(map.current!);
      
      markersRef.current[marker.id] = mapboxMarker;
    });
  }, [mapLoaded, createSOSTriggerMarker, createSearchMarker]);

  // Update all markers when markers change
  useEffect(() => {
    updateAllMarkers(markers);
  }, [markers, updateAllMarkers]);

  // Expose animation function
  useEffect(() => {
    if (mapRef && map.current) {
      mapRef.animateToLocation = animateToLocation;
    }
  }, [mapRef, animateToLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* Custom Map Controls */}
      {mapLoaded && (
        <MapControls
          onGPSRecenter={handleGPSRecenter}
          onCompassReset={handleCompassReset}
          onMapStyleToggle={handleMapStyleToggle}
          mapRotation={mapRotation}
          isLocationLoading={isLocationLoading}
          locationAccuracy={userLocation?.accuracy}
          hasLocationPermission={hasPermission}
          currentMapStyle={currentMapStyle}
        />
      )}

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      )}

      {/* Animation indicator */}
      {isAnimating && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
          🛰️ Animating to location...
        </div>
      )}
    </div>
  );
}; 