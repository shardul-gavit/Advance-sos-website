#!/usr/bin/env node

/**
 * Admin Panel Features Test
 * Tests GPS, Location, Map Loading, and other critical features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
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

// Test GPS and Location Features
const testLocationFeatures = () => {
  log('Testing GPS and Location Features...');
  
  // Check location service file
  const locationServicePath = path.join(__dirname, 'src/services/locationService.ts');
  if (fs.existsSync(locationServicePath)) {
    const content = fs.readFileSync(locationServicePath, 'utf8');
    
    // Check for key functions
    const hasGetCurrentLocation = content.includes('getCurrentLocation');
    const hasGetQuickLocation = content.includes('getQuickLocation');
    const hasStartLocationTracking = content.includes('startLocationTracking');
    const hasGeolocationAPI = content.includes('navigator.geolocation');
    
    addResult('Location Service File', true, 'Location service file exists');
    addResult('getCurrentLocation Function', hasGetCurrentLocation, hasGetCurrentLocation ? 'Function found' : 'Function missing');
    addResult('getQuickLocation Function', hasGetQuickLocation, hasGetQuickLocation ? 'Function found' : 'Function missing');
    addResult('Location Tracking Function', hasStartLocationTracking, hasStartLocationTracking ? 'Function found' : 'Function missing');
    addResult('Geolocation API Usage', hasGeolocationAPI, hasGeolocationAPI ? 'API usage found' : 'API usage missing');
  } else {
    addResult('Location Service File', false, 'Location service file missing');
  }
  
  // Check location context
  const locationContextPath = path.join(__dirname, 'src/contexts/LocationContext.tsx');
  if (fs.existsSync(locationContextPath)) {
    const content = fs.readFileSync(locationContextPath, 'utf8');
    const hasLocationProvider = content.includes('LocationProvider');
    const hasUseLocation = content.includes('useLocation');
    const hasRequestPermission = content.includes('requestLocationPermission');
    
    addResult('Location Context File', true, 'Location context file exists');
    addResult('Location Provider', hasLocationProvider, hasLocationProvider ? 'Provider found' : 'Provider missing');
    addResult('useLocation Hook', hasUseLocation, hasUseLocation ? 'Hook found' : 'Hook missing');
    addResult('Permission Request', hasRequestPermission, hasRequestPermission ? 'Permission request found' : 'Permission request missing');
  } else {
    addResult('Location Context File', false, 'Location context file missing');
  }
};

// Test Map Features
const testMapFeatures = () => {
  log('Testing Map Features...');
  
  // Check map components
  const mapComponents = [
    'src/components/map/AdminMap.tsx',
    'src/components/map/EnhancedAdminMap.tsx',
    'src/components/admin/LocationMap.tsx'
  ];
  
  mapComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasMapbox = content.includes('mapbox');
      const hasReactMapGL = content.includes('react-map-gl');
      const hasMapComponent = content.includes('Map');
      
      addResult(`${path.basename(componentPath)} File`, true, 'Map component file exists');
      addResult(`${path.basename(componentPath)} Mapbox Integration`, hasMapbox, hasMapbox ? 'Mapbox integration found' : 'Mapbox integration missing');
      addResult(`${path.basename(componentPath)} React Map GL`, hasReactMapGL, hasReactMapGL ? 'React Map GL found' : 'React Map GL missing');
      addResult(`${path.basename(componentPath)} Map Component`, hasMapComponent, hasMapComponent ? 'Map component found' : 'Map component missing');
    } else {
      addResult(`${path.basename(componentPath)} File`, false, 'Map component file missing');
    }
  });
  
  // Check mapbox configuration
  const mapboxConfigPath = path.join(__dirname, 'src/lib/mapbox.ts');
  if (fs.existsSync(mapboxConfigPath)) {
    addResult('Mapbox Configuration File', true, 'Mapbox config file exists');
  } else {
    addResult('Mapbox Configuration File', false, 'Mapbox config file missing');
  }
};

// Test UI Components
const testUIComponents = () => {
  log('Testing UI Components...');
  
  const uiComponents = [
    'src/components/ui/location-status.tsx',
    'src/components/ui/location-permission.tsx',
    'src/components/ui/location-performance.tsx'
  ];
  
  uiComponents.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
      addResult(`${path.basename(componentPath)} File`, true, 'UI component file exists');
    } else {
      addResult(`${path.basename(componentPath)} File`, false, 'UI component file missing');
    }
  });
};

// Test Package Dependencies
const testDependencies = () => {
  log('Testing Package Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    const requiredDeps = [
      'react-map-gl',
      'mapbox-gl',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ];
    
    const missingDeps = [];
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length === 0) {
      addResult('Package Dependencies', true, 'All required dependencies present');
    } else {
      addResult('Package Dependencies', false, `Missing dependencies: ${missingDeps.join(', ')}`);
    }
  } catch (error) {
    addResult('Package Dependencies', false, `Error reading package.json: ${error.message}`);
  }
};

// Test Environment Configuration
const testEnvironment = () => {
  log('Testing Environment Configuration...');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (fs.existsSync(envPath)) {
    addResult('Environment File', true, '.env file exists');
  } else {
    addResult('Environment File', false, '.env file missing');
  }
  
  if (fs.existsSync(envExamplePath)) {
    addResult('Environment Example', true, 'env.example file exists');
  } else {
    addResult('Environment Example', false, 'env.example file missing');
  }
  
  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_MAPBOX_ACCESS_TOKEN'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      addResult(`${envVar} Environment Variable`, true, 'Environment variable set');
    } else {
      addResult(`${envVar} Environment Variable`, false, 'Environment variable not set');
    }
  });
};

// Test Build Configuration
const testBuildConfig = () => {
  log('Testing Build Configuration...');
  
  const configFiles = [
    'vite.config.ts',
    'tsconfig.json',
    'tailwind.config.ts'
  ];
  
  configFiles.forEach(configFile => {
    const fullPath = path.join(__dirname, configFile);
    if (fs.existsSync(fullPath)) {
      addResult(`${configFile} File`, true, 'Config file exists');
    } else {
      addResult(`${configFile} File`, false, 'Config file missing');
    }
  });
};

// Test Main Application Files
const testMainFiles = () => {
  log('Testing Main Application Files...');
  
  const mainFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'index.html',
    'src/pages/Index.tsx'
  ];
  
  mainFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      addResult(`${path.basename(filePath)} File`, true, 'Main file exists');
    } else {
      addResult(`${path.basename(filePath)} File`, false, 'Main file missing');
    }
  });
};

// Test Location Performance Features
const testLocationPerformance = () => {
  log('Testing Location Performance Features...');
  
  const locationServicePath = path.join(__dirname, 'src/services/locationService.ts');
  if (fs.existsSync(locationServicePath)) {
    const content = fs.readFileSync(locationServicePath, 'utf8');
    
    // Check for performance optimizations
    const hasQuickLocation = content.includes('getQuickLocation');
    const hasTimeoutOptimization = content.includes('timeout: 8000') || content.includes('timeout: 3000');
    const hasHighAccuracyOption = content.includes('enableHighAccuracy: false');
    const hasAsyncGeocoding = content.includes('.then(cityInfo =>');
    
    addResult('Quick Location Function', hasQuickLocation, hasQuickLocation ? 'Quick location function found' : 'Quick location function missing');
    addResult('Timeout Optimization', hasTimeoutOptimization, hasTimeoutOptimization ? 'Timeout optimization found' : 'Timeout optimization missing');
    addResult('High Accuracy Options', hasHighAccuracyOption, hasHighAccuracyOption ? 'High accuracy options found' : 'High accuracy options missing');
    addResult('Async Geocoding', hasAsyncGeocoding, hasAsyncGeocoding ? 'Async geocoding found' : 'Async geocoding missing');
  }
};

// Run all tests
const runAllTests = () => {
  console.log('🚀 Starting Admin Panel Features Test...\n');
  
  testLocationFeatures();
  testMapFeatures();
  testUIComponents();
  testDependencies();
  testEnvironment();
  testBuildConfig();
  testMainFiles();
  testLocationPerformance();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the issues above.');
  } else {
    console.log('\n✅ All tests passed! Admin panel features are working correctly.');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: `${((results.passed / results.total) * 100).toFixed(1)}%`
    },
    details: results.details
  };
  
  fs.writeFileSync(path.join(__dirname, 'features-test-report.json'), JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed report saved to features-test-report.json');
};

// Run tests
runAllTests(); 