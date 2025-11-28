// UI wiring for the SOS Mapbox demo
// Handles style switching and satellite overlay toggling.

import { createMap, MAP_STYLES, toggleSatelliteLayer } from './map.js';

let mapInstance = null;

function init() {
  // Initialize map with configurable center/zoom if needed
  mapInstance = createMap({
    containerId: 'map',
    // Override these if you want a different default location
    center: [73.1812, 22.3072],
    zoom: 12,
  });

  setupStyleSwitcher();
  setupSatelliteOverlayToggle();
}

function setupStyleSwitcher() {
  const radios = document.querySelectorAll('input[name="base-style"]');
  if (!radios.length || !mapInstance) return;

  radios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      const value = event.target.value;
      const newStyle =
        value === 'satellite' ? MAP_STYLES.satellite : MAP_STYLES.normal;

      if (mapInstance && newStyle) {
        mapInstance.setStyle(newStyle);
      }
    });
  });
}

function setupSatelliteOverlayToggle() {
  const checkbox = document.getElementById('satellite-overlay-toggle');
  if (!checkbox || !mapInstance) return;

  checkbox.addEventListener('change', (event) => {
    toggleSatelliteLayer(mapInstance, event.target.checked);
  });
}

// Initialize once the DOM is ready
window.addEventListener('DOMContentLoaded', init);


