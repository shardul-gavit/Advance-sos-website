// Main Mapbox GL JS logic for the SOS demo map
// Uses the global `mapboxgl` object loaded from the Mapbox CDN.

// Default Mapbox configuration (override via createMap options if needed)
const DEFAULT_CENTER = [73.1812, 22.3072]; // Vadodara, Gujarat (lng, lat)
const DEFAULT_ZOOM = 12;

// Base styles
export const MAP_STYLES = {
  normal: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// Access token – replace with your real token or pass in via options
const MAPBOX_ACCESS_TOKEN =
  window.MAPBOX_ACCESS_TOKEN ||
  'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

// Cache for demo SOS data so we only fetch once
let sosDataPromise = null;

async function loadSOSData() {
  if (!sosDataPromise) {
    sosDataPromise = fetch('sos.geojson').then((res) => {
      if (!res.ok) {
        throw new Error('Failed to load sos.geojson');
      }
      return res.json();
    });
  }
  return sosDataPromise;
}

/**
 * Add SOS GeoJSON source and circle layer to the given map instance.
 * - Source name: "sos"
 * - Layer id: "sos-points"
 */
export async function addSOSLayers(map) {
  if (!map) return;

  try {
    const data = await loadSOSData();

    // If the source already exists, just update its data and exit
    if (map.getSource('sos')) {
      map.getSource('sos').setData(data);
    } else {
      map.addSource('sos', {
        type: 'geojson',
        data,
      });
    }

    // Add the main SOS point layer if it doesn't exist yet
    if (!map.getLayer('sos-points')) {
      map.addLayer({
        id: 'sos-points',
        type: 'circle',
        source: 'sos',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ef4444',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // Setup popup interaction once layer exists
    setupSOSPopups(map);
  } catch (error) {
    console.error('Error adding SOS layers:', error);
  }
}

/**
 * Attach click + hover handlers for SOS markers to show popups.
 * Popups read from feature properties:
 * - user
 * - time
 * - incident
 */
function setupSOSPopups(map) {
  if (!map.getLayer('sos-points')) return;

  // Avoid registering handlers multiple times
  const handlerFlag = '_sosPopupHandlersAttached';
  if (map[handlerFlag]) return;
  map[handlerFlag] = true;

  map.on('click', 'sos-points', (e) => {
    if (!e.features || !e.features.length) return;
    const feature = e.features[0];

    const coordinates = feature.geometry.coordinates.slice();
    const props = feature.properties || {};

    const user = props.user || 'Unknown user';
    const time = props.time || 'Unknown time';
    const incident = props.incident || 'No incident details';

    const html = `
      <div class="sos-popup">
        <h3>SOS Alert</h3>
        <p><strong>User:</strong> ${user}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Incident:</strong> ${incident}</p>
      </div>
    `;

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
  });

  map.on('mouseenter', 'sos-points', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'sos-points', () => {
    map.getCanvas().style.cursor = '';
  });
}

/**
 * Ensure the optional satellite raster source + layer exists.
 * - Source id: "satellite"
 * - Layer id: "satellite-layer"
 */
function ensureSatelliteOverlay(map) {
  if (!map) return;

  if (!map.getSource('satellite')) {
    map.addSource('satellite', {
      type: 'raster',
      url: 'mapbox://mapbox.satellite',
      tileSize: 256,
    });
  }

  if (!map.getLayer('satellite-layer')) {
    // Put the raster layer under labels but above base tiles where possible
    const firstSymbolLayerId = map
      .getStyle()
      .layers.find((l) => l.type === 'symbol')?.id;

    map.addLayer(
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        layout: {
          visibility: 'none',
        },
        paint: {
          'raster-opacity': 0.85,
        },
      },
      firstSymbolLayerId || undefined
    );
  }
}

/**
 * Public helper to toggle satellite overlay visibility.
 */
export function toggleSatelliteLayer(map, show) {
  if (!map) return;
  if (!map.getLayer('satellite-layer')) {
    ensureSatelliteOverlay(map);
  }

  const visibility = show ? 'visible' : 'none';
  map.setLayoutProperty('satellite-layer', 'visibility', visibility);
}

/**
 * Create and initialize the Mapbox map.
 * - Adds navigation, fullscreen, and geolocate controls.
 * - Loads SOS layers on initial load.
 * - Re-applies custom layers and satellite overlay on style changes.
 */
export function createMap(options = {}) {
  const {
    containerId = 'map',
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    accessToken = MAPBOX_ACCESS_TOKEN,
    style = MAP_STYLES.normal,
  } = options;

  if (!mapboxgl) {
    throw new Error('mapboxgl is not available. Make sure Mapbox GL JS is loaded.');
  }

  mapboxgl.accessToken = accessToken;

  const map = new mapboxgl.Map({
    container: containerId,
    style,
    center,
    zoom,
  });

  // Basic controls
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    }),
    'top-right'
  );

  // Initial load
  map.on('load', async () => {
    await addSOSLayers(map);
    ensureSatelliteOverlay(map);
  });

  // Re-add custom layers after any style change
  map.on('style.load', async () => {
    await addSOSLayers(map);
    ensureSatelliteOverlay(map);
  });

  return map;
}


