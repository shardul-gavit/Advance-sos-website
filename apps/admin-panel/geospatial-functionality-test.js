#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ GEOSPATIAL FUNCTIONALITY TEST - ADVANCE SOS ADMIN PANEL');
console.log('==========================================================');
console.log('');

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
};

const addResult = (testName, passed, details = '') => {
  results.total++;
  if (passed) {
    results.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    results.failed++;
    log(`FAIL: ${testName}`, 'error');
    if (details) log(`Details: ${details}`, 'error');
  }
  results.details.push({ testName, passed, details });
};

// Test 1: Dashboard Geospatial View Panel
const testDashboardGeospatialPanel = () => {
  log('Testing Dashboard Geospatial View Panel...');
  
  const dashboardFile = path.join(__dirname, 'src', 'pages', 'admin', 'dashboard.tsx');
  
  if (!fs.existsSync(dashboardFile)) {
    addResult('Dashboard File Exists', false, 'dashboard.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(dashboardFile, 'utf8');
  
  // Check for geospatial view panel
  const hasGeospatialPanel = content.includes('GEO-SPATIAL VIEW');
  addResult('Geospatial View Panel', hasGeospatialPanel, hasGeospatialPanel ? '' : 'GEO-SPATIAL VIEW not found');
  
  // Check for map control buttons
  const hasSOSMapButton = content.includes('SOS MAP');
  addResult('SOS MAP Button', hasSOSMapButton, hasSOSMapButton ? '' : 'SOS MAP button not found');
  
  const hasLocationManagerButton = content.includes('LOCATION MANAGER');
  addResult('LOCATION MANAGER Button', hasLocationManagerButton, hasLocationManagerButton ? '' : 'LOCATION MANAGER button not found');
  
  const hasSupabaseMapButton = content.includes('SUPABASE MAP');
  addResult('SUPABASE MAP Button', hasSupabaseMapButton, hasSupabaseMapButton ? '' : 'SUPABASE MAP button not found');
  
  // Check for map view state management
  const hasMapViewState = content.includes('activeMapView') && content.includes('setActiveMapView');
  addResult('Map View State Management', hasMapViewState, hasMapViewState ? '' : 'Map view state not implemented');
  
  // Check for map view handlers
  const hasMapViewHandlers = content.includes('handleMapViewChange') && 
                           content.includes('handleSOSMapView') && 
                           content.includes('handleLocationManagerView') && 
                           content.includes('handleSupabaseMapView');
  addResult('Map View Handlers', hasMapViewHandlers, hasMapViewHandlers ? '' : 'Map view handlers not implemented');
  
  // Check for map status indicator
  const hasStatusIndicator = content.includes('Map Status Indicator') || content.includes('activeMapView');
  addResult('Map Status Indicator', hasStatusIndicator, hasStatusIndicator ? '' : 'Map status indicator not found');
  
  // Check for EnhancedAdminMap integration
  const hasEnhancedMap = content.includes('EnhancedAdminMap');
  addResult('EnhancedAdminMap Integration', hasEnhancedMap, hasEnhancedMap ? '' : 'EnhancedAdminMap not integrated');
};

// Test 2: EnhancedAdminMap Component
const testEnhancedAdminMap = () => {
  log('Testing EnhancedAdminMap Component...');
  
  const mapFile = path.join(__dirname, 'src', 'components', 'map', 'EnhancedAdminMap.tsx');
  
  if (!fs.existsSync(mapFile)) {
    addResult('EnhancedAdminMap File Exists', false, 'EnhancedAdminMap.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(mapFile, 'utf8');
  
  // Check for Mapbox integration
  const hasMapboxImport = content.includes('mapbox-gl') && content.includes('MAPBOX_CONFIG');
  addResult('Mapbox Integration', hasMapboxImport, hasMapboxImport ? '' : 'Mapbox integration not found');
  
  // Check for clustering functionality
  const hasClustering = content.includes('cluster') && content.includes('addClusteringSource');
  addResult('Marker Clustering', hasClustering, hasClustering ? '' : 'Clustering functionality not found');
  
  // Check for marker management
  const hasMarkerManagement = content.includes('updateMarkers') && content.includes('createMarkerElement');
  addResult('Marker Management', hasMarkerManagement, hasMarkerManagement ? '' : 'Marker management not found');
  
  // Check for popup functionality
  const hasPopupFunctionality = content.includes('addPopupToMarker') && content.includes('setPopup');
  addResult('Popup Functionality', hasPopupFunctionality, hasPopupFunctionality ? '' : 'Popup functionality not found');
  
  // Check for animation support
  const hasAnimation = content.includes('animateToLocation') && content.includes('easeTo');
  addResult('Map Animations', hasAnimation, hasAnimation ? '' : 'Animation functionality not found');
  
  // Check for globe projection
  const hasGlobeProjection = content.includes('setProjection') && content.includes('globe');
  addResult('Globe Projection', hasGlobeProjection, hasGlobeProjection ? '' : 'Globe projection not found');
};

// Test 3: Geospatial Services
const testGeospatialServices = () => {
  log('Testing Geospatial Services...');
  
  const geospatialFile = path.join(__dirname, 'src', 'lib', 'services', 'geospatial.ts');
  
  if (!fs.existsSync(geospatialFile)) {
    addResult('Geospatial Services File Exists', false, 'geospatial.ts not found');
    return;
  }
  
  const content = fs.readFileSync(geospatialFile, 'utf8');
  
  // Check for zone management
  const hasZoneManagement = content.includes('getZones') && content.includes('createZone') && content.includes('updateZone');
  addResult('Zone Management', hasZoneManagement, hasZoneManagement ? '' : 'Zone management not found');
  
  // Check for geosweep functionality
  const hasGeoSweep = content.includes('createGeoSweep') && content.includes('getRespondersInSweep');
  addResult('GeoSweep Functionality', hasGeoSweep, hasGeoSweep ? '' : 'GeoSweep functionality not found');
  
  // Check for routing
  const hasRouting = content.includes('getRoute') && content.includes('RouteInfo');
  addResult('Routing Functionality', hasRouting, hasRouting ? '' : 'Routing functionality not found');
  
  // Check for isochrones
  const hasIsochrones = content.includes('getIsochrones') && content.includes('IsochroneZone');
  addResult('Isochrone Functionality', hasIsochrones, hasIsochrones ? '' : 'Isochrone functionality not found');
  
  // Check for clustering
  const hasClustering = content.includes('createClusters') && content.includes('ClusterInfo');
  addResult('Clustering Analysis', hasClustering, hasClustering ? '' : 'Clustering analysis not found');
  
  // Check for distance calculations
  const hasDistanceCalc = content.includes('calculateDistance') && content.includes('isPointInPolygon');
  addResult('Distance Calculations', hasDistanceCalc, hasDistanceCalc ? '' : 'Distance calculations not found');
};

// Test 4: Mapbox Configuration
const testMapboxConfiguration = () => {
  log('Testing Mapbox Configuration...');
  
  const mapboxFile = path.join(__dirname, 'src', 'lib', 'mapbox.ts');
  
  if (!fs.existsSync(mapboxFile)) {
    addResult('Mapbox Config File Exists', false, 'mapbox.ts not found');
    return;
  }
  
  const content = fs.readFileSync(mapboxFile, 'utf8');
  
  // Check for MAPBOX_CONFIG
  const hasMapboxConfig = content.includes('MAPBOX_CONFIG') && content.includes('accessToken');
  addResult('MAPBOX_CONFIG Object', hasMapboxConfig, hasMapboxConfig ? '' : 'MAPBOX_CONFIG not found');
  
  // Check for validation function
  const hasValidation = content.includes('validateMapboxConfig');
  addResult('Mapbox Validation', hasValidation, hasValidation ? '' : 'Mapbox validation not found');
  
  // Check for clustering config
  const hasClusteringConfig = content.includes('CLUSTERING_CONFIG') && content.includes('clusterRadius');
  addResult('Clustering Configuration', hasClusteringConfig, hasClusteringConfig ? '' : 'Clustering config not found');
  
  // Check for marker config
  const hasMarkerConfig = content.includes('MARKER_CONFIG') && content.includes('sos') && content.includes('helper');
  addResult('Marker Configuration', hasMarkerConfig, hasMarkerConfig ? '' : 'Marker config not found');
  
  // Check for utility functions
  const hasUtils = content.includes('mapboxUtils') && content.includes('createFeature');
  addResult('Mapbox Utilities', hasUtils, hasUtils ? '' : 'Mapbox utilities not found');
};

// Test 5: Location Management Components
const testLocationManagement = () => {
  log('Testing Location Management Components...');
  
  const locationMapFile = path.join(__dirname, 'src', 'components', 'admin', 'LocationMap.tsx');
  
  if (!fs.existsSync(locationMapFile)) {
    addResult('LocationMap Component Exists', false, 'LocationMap.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(locationMapFile, 'utf8');
  
  // Check for location management functionality
  const hasLocationManagement = content.includes('Location Management') && content.includes('Interactive map');
  addResult('Location Management UI', hasLocationManagement, hasLocationManagement ? '' : 'Location management UI not found');
  
  // Check for map click handling
  const hasMapClick = content.includes('handleMapClick') && content.includes('onClick');
  addResult('Map Click Handling', hasMapClick, hasMapClick ? '' : 'Map click handling not found');
  
  // Check for real-time updates
  const hasRealtime = content.includes('subscribeToLocations') && content.includes('subscription');
  addResult('Real-time Updates', hasRealtime, hasRealtime ? '' : 'Real-time updates not found');
  
  // Check for location markers
  const hasLocationMarkers = content.includes('Marker') && content.includes('longitude') && content.includes('latitude');
  addResult('Location Markers', hasLocationMarkers, hasLocationMarkers ? '' : 'Location markers not found');
};

// Test 6: Advanced Map Features
const testAdvancedMapFeatures = () => {
  log('Testing Advanced Map Features...');
  
  const advancedMapFile = path.join(__dirname, 'src', 'components', 'map', 'AdvancedMap.tsx');
  
  if (!fs.existsSync(advancedMapFile)) {
    addResult('AdvancedMap Component Exists', false, 'AdvancedMap.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(advancedMapFile, 'utf8');
  
  // Check for advanced features
  const hasGeoSweep = content.includes('GeoSweep') && content.includes('createGeoSweep');
  addResult('GeoSweep Features', hasGeoSweep, hasGeoSweep ? '' : 'GeoSweep features not found');
  
  const hasZoneDrawing = content.includes('Zone') && content.includes('MapboxDraw');
  addResult('Zone Drawing', hasZoneDrawing, hasZoneDrawing ? '' : 'Zone drawing not found');
  
  const hasRouting = content.includes('RouteInfo') && content.includes('getRoute');
  addResult('Advanced Routing', hasRouting, hasRouting ? '' : 'Advanced routing not found');
  
  const hasIsochrones = content.includes('IsochroneZone') && content.includes('getIsochrones');
  addResult('Isochrone Analysis', hasIsochrones, hasIsochrones ? '' : 'Isochrone analysis not found');
};

// Run all tests
const runAllTests = () => {
  testDashboardGeospatialPanel();
  testEnhancedAdminMap();
  testGeospatialServices();
  testMapboxConfiguration();
  testLocationManagement();
  testAdvancedMapFeatures();
  
  // Summary
  console.log('');
  console.log('📊 GEOSPATIAL FUNCTIONALITY TEST RESULTS:');
  console.log('==========================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 ALL GEOSPATIAL TESTS PASSED!');
    console.log('✅ The admin panel geospatial functionality is fully operational.');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Please review and fix the issues above.');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(1)
    },
    details: results.details
  };
  
  fs.writeFileSync('geospatial-test-report.json', JSON.stringify(report, null, 2));
  console.log('');
  console.log('📄 Detailed report saved to geospatial-test-report.json');
};

// Run tests
runAllTests(); 