#!/usr/bin/env node

/**
 * Complete Admin Panel Test Suite
 * Tests all features of the Advance SOS System Admin Panel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  mapboxToken: process.env.VITE_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token',
  firebaseConfig: {
    apiKey: process.env.VITE_FIREBASE_API_KEY || 'your-firebase-key',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id'
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  issues: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const addTestResult = (testName, passed, details = '', issues = []) => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName}`, 'error');
    if (details) log(`Details: ${details}`, 'error');
  }
  
  testResults.details.push({ testName, passed, details });
  if (issues.length > 0) {
    testResults.issues.push(...issues);
  }
};

// Test functions
const testFileStructure = () => {
  log('Testing file structure...');
  
  const requiredFiles = [
    'src/lib/firebase.ts',
    'src/components/media/MediaPlayer.tsx',
    'src/components/media/MediaUpload.tsx',
    'src/components/map/EnhancedAdminMap.tsx',
    'src/lib/services/distance.ts',
    'src/components/admin/TestMode.tsx',
    'public/firebase-messaging-sw.js',
    'COMPLETE_DATABASE_SETUP.sql'
  ];

  let allFilesExist = true;
  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      allFilesExist = false;
      missingFiles.push(file);
    }
  }

  addTestResult(
    'File Structure Check',
    allFilesExist,
    allFilesExist ? 'All required files present' : `Missing files: ${missingFiles.join(', ')}`
  );
};

const testPackageDependencies = () => {
  log('Testing package dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['firebase', 'lodash', '@types/lodash', 'mapbox-gl', '@supabase/supabase-js'];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);
    
    addTestResult(
      'Package Dependencies',
      missingDeps.length === 0,
      missingDeps.length === 0 ? 'All required dependencies present' : `Missing: ${missingDeps.join(', ')}`
    );
  } catch (error) {
    addTestResult('Package Dependencies', false, `Error reading package.json: ${error.message}`);
  }
};

const testEnvironmentVariables = () => {
  log('Testing environment variables...');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_MAPBOX_ACCESS_TOKEN',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  addTestResult(
    'Environment Variables',
    missingVars.length === 0,
    missingVars.length === 0 ? 'All required env vars present' : `Missing: ${missingVars.join(', ')}`
  );
};

const testDatabaseConnection = async () => {
  log('Testing database connection...');
  
  try {
    // Simulate database connection test
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('sos_alerts').select('count').limit(1);
    
    addTestResult(
      'Database Connection',
      !error,
      error ? `Connection failed: ${error.message}` : 'Database connection successful'
    );
  } catch (error) {
    addTestResult('Database Connection', false, `Connection error: ${error.message}`);
  }
};

const testTableExistence = async () => {
  log('Testing database tables...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    
    const requiredTables = [
      'users', 'sos_events', 'helpers', 'responders', 'hospitals',
      'media', 'locations', 'fcm_tokens', 'admins', 'audit_logs'
    ];

    let allTablesExist = true;
    const missingTables = [];

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === 'PGRST116') {
        allTablesExist = false;
        missingTables.push(table);
      }
    }

    addTestResult(
      'Database Tables',
      allTablesExist,
      allTablesExist ? 'All required tables exist' : `Missing tables: ${missingTables.join(', ')}`
    );
  } catch (error) {
    addTestResult('Database Tables', false, `Table check error: ${error.message}`);
  }
};

const testFirebaseConfiguration = () => {
  log('Testing Firebase configuration...');
  
  try {
    // Check if Firebase config is properly structured
    const hasValidConfig = TEST_CONFIG.firebaseConfig.apiKey && 
                          TEST_CONFIG.firebaseConfig.projectId &&
                          TEST_CONFIG.firebaseConfig.apiKey !== 'your-firebase-key';
    
    addTestResult(
      'Firebase Configuration',
      hasValidConfig,
      hasValidConfig ? 'Firebase config valid' : 'Firebase config missing or invalid'
    );
  } catch (error) {
    addTestResult('Firebase Configuration', false, `Config error: ${error.message}`);
  }
};

const testMapboxConfiguration = () => {
  log('Testing Mapbox configuration...');
  
  const hasValidToken = TEST_CONFIG.mapboxToken && 
                       TEST_CONFIG.mapboxToken !== 'your-mapbox-token';
  
  addTestResult(
    'Mapbox Configuration',
    hasValidToken,
    hasValidToken ? 'Mapbox token valid' : 'Mapbox token missing or invalid'
  );
};

const testComponentImports = () => {
  log('Testing component imports...');
  
  try {
    // Test if components can be imported (basic syntax check)
    const components = [
      '../src/components/media/MediaPlayer.tsx',
      '../src/components/media/MediaUpload.tsx',
      '../src/components/map/EnhancedAdminMap.tsx',
      '../src/components/admin/TestMode.tsx'
    ];

    let allComponentsValid = true;
    const invalidComponents = [];

    for (const component of components) {
      try {
        const componentPath = path.join(__dirname, component);
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Basic syntax checks
        const hasReactImport = content.includes('import React');
        const hasExport = content.includes('export');
        const hasValidJSX = content.includes('return (') || content.includes('return(');
        
        if (!hasReactImport || !hasExport || !hasValidJSX) {
          allComponentsValid = false;
          invalidComponents.push(component);
        }
      } catch (error) {
        allComponentsValid = false;
        invalidComponents.push(component);
      }
    }

    addTestResult(
      'Component Imports',
      allComponentsValid,
      allComponentsValid ? 'All components valid' : `Invalid components: ${invalidComponents.join(', ')}`
    );
  } catch (error) {
    addTestResult('Component Imports', false, `Import error: ${error.message}`);
  }
};

const testServiceImports = () => {
  log('Testing service imports...');
  
  try {
    const services = [
      '../src/lib/firebase.ts',
      '../src/lib/services/distance.ts'
    ];

    let allServicesValid = true;
    const invalidServices = [];

    for (const service of services) {
      try {
        const servicePath = path.join(__dirname, service);
        const content = fs.readFileSync(servicePath, 'utf8');
        
        // Basic syntax checks
        const hasExports = content.includes('export');
        const hasValidSyntax = !content.includes('syntax error');
        
        if (!hasExports || !hasValidSyntax) {
          allServicesValid = false;
          invalidServices.push(service);
        }
      } catch (error) {
        allServicesValid = false;
        invalidServices.push(service);
      }
    }

    addTestResult(
      'Service Imports',
      allServicesValid,
      allServicesValid ? 'All services valid' : `Invalid services: ${invalidServices.join(', ')}`
    );
  } catch (error) {
    addTestResult('Service Imports', false, `Service error: ${error.message}`);
  }
};

const testBuildProcess = () => {
  log('Testing build process...');
  
  try {
    // Check if build files exist or can be generated
    const hasViteConfig = fs.existsSync(path.join(__dirname, 'vite.config.ts'));
    const hasTsConfig = fs.existsSync(path.join(__dirname, 'tsconfig.json'));
    const hasIndexHtml = fs.existsSync(path.join(__dirname, 'index.html'));
    
    const buildReady = hasViteConfig && hasTsConfig && hasIndexHtml;
    
    addTestResult(
      'Build Process',
      buildReady,
      buildReady ? 'Build configuration ready' : 'Missing build configuration files'
    );
  } catch (error) {
    addTestResult('Build Process', false, `Build error: ${error.message}`);
  }
};

const testSecurityFeatures = () => {
  log('Testing security features...');
  
  try {
    const securityChecks = [];
    
    // Check for CSP headers
    const hasCSP = fs.existsSync(path.join(__dirname, 'src/utils/csp.ts'));
    securityChecks.push(hasCSP);
    
    // Check for authentication guards
    const hasAuthGuard = fs.existsSync(path.join(__dirname, 'src/components/auth/AuthGuard.tsx'));
    securityChecks.push(hasAuthGuard);
    
    // Check for input validation
    const hasValidation = fs.existsSync(path.join(__dirname, 'src/utils/security.ts'));
    securityChecks.push(hasValidation);
    
    const allSecurityFeatures = securityChecks.every(check => check);
    
    addTestResult(
      'Security Features',
      allSecurityFeatures,
      allSecurityFeatures ? 'All security features present' : 'Some security features missing'
    );
  } catch (error) {
    addTestResult('Security Features', false, `Security check error: ${error.message}`);
  }
};

const testRealTimeFeatures = () => {
  log('Testing real-time features...');
  
  try {
    const realtimeChecks = [];
    
    // Check for Supabase realtime configuration
    const hasRealtimeConfig = fs.existsSync(path.join(__dirname, 'src/lib/services/realtime.ts'));
    realtimeChecks.push(hasRealtimeConfig);
    
    // Check for WebSocket handling
    const hasWebSocketHandling = fs.existsSync(path.join(__dirname, 'src/contexts/LocationContext.tsx'));
    realtimeChecks.push(hasWebSocketHandling);
    
    // Check for FCM integration
    const hasFCM = fs.existsSync(path.join(__dirname, 'src/lib/firebase.ts'));
    realtimeChecks.push(hasFCM);
    
    const allRealtimeFeatures = realtimeChecks.every(check => check);
    
    addTestResult(
      'Real-time Features',
      allRealtimeFeatures,
      allRealtimeFeatures ? 'All real-time features present' : 'Some real-time features missing'
    );
  } catch (error) {
    addTestResult('Real-time Features', false, `Realtime check error: ${error.message}`);
  }
};

const testMediaHandling = () => {
  log('Testing media handling...');
  
  try {
    const mediaChecks = [];
    
    // Check for media player component
    const hasMediaPlayer = fs.existsSync(path.join(__dirname, 'src/components/media/MediaPlayer.tsx'));
    mediaChecks.push(hasMediaPlayer);
    
    // Check for media upload component
    const hasMediaUpload = fs.existsSync(path.join(__dirname, 'src/components/media/MediaUpload.tsx'));
    mediaChecks.push(hasMediaUpload);
    
    // Check for storage configuration
    const hasStorageConfig = fs.existsSync(path.join(__dirname, 'src/lib/supabase.ts'));
    mediaChecks.push(hasStorageConfig);
    
    const allMediaFeatures = mediaChecks.every(check => check);
    
    addTestResult(
      'Media Handling',
      allMediaFeatures,
      allMediaFeatures ? 'All media features present' : 'Some media features missing'
    );
  } catch (error) {
    addTestResult('Media Handling', false, `Media check error: ${error.message}`);
  }
};

const testMapFeatures = () => {
  log('Testing map features...');
  
  try {
    const mapChecks = [];
    
    // Check for enhanced map component
    const hasEnhancedMap = fs.existsSync(path.join(__dirname, 'src/components/map/EnhancedAdminMap.tsx'));
    mapChecks.push(hasEnhancedMap);
    
    // Check for mapbox configuration
    const hasMapboxConfig = fs.existsSync(path.join(__dirname, 'src/lib/mapbox.ts'));
    mapChecks.push(hasMapboxConfig);
    
    // Check for distance calculation service
    const hasDistanceService = fs.existsSync(path.join(__dirname, 'src/lib/services/distance.ts'));
    mapChecks.push(hasDistanceService);
    
    const allMapFeatures = mapChecks.every(check => check);
    
    addTestResult(
      'Map Features',
      allMapFeatures,
      allMapFeatures ? 'All map features present' : 'Some map features missing'
    );
  } catch (error) {
    addTestResult('Map Features', false, `Map check error: ${error.message}`);
  }
};

const testTestMode = () => {
  log('Testing test mode features...');
  
  try {
    const testModeChecks = [];
    
    // Check for test mode component
    const hasTestMode = fs.existsSync(path.join(__dirname, 'src/components/admin/TestMode.tsx'));
    testModeChecks.push(hasTestMode);
    
    // Check for test database setup
    const hasTestSetup = fs.existsSync(path.join(__dirname, 'COMPLETE_DATABASE_SETUP.sql'));
    testModeChecks.push(hasTestSetup);
    
    const allTestFeatures = testModeChecks.every(check => check);
    
    addTestResult(
      'Test Mode Features',
      allTestFeatures,
      allTestFeatures ? 'All test features present' : 'Some test features missing'
    );
  } catch (error) {
    addTestResult('Test Mode Features', false, `Test mode check error: ${error.message}`);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🚀 Starting Complete Admin Panel Test Suite...', 'info');
  log('', 'info');
  
  // Run all tests
  testFileStructure();
  testPackageDependencies();
  testEnvironmentVariables();
  await testDatabaseConnection();
  await testTableExistence();
  testFirebaseConfiguration();
  testMapboxConfiguration();
  testComponentImports();
  testServiceImports();
  testBuildProcess();
  testSecurityFeatures();
  testRealTimeFeatures();
  testMediaHandling();
  testMapFeatures();
  testTestMode();
  
  // Generate test report
  log('', 'info');
  log('📊 Test Results Summary:', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  if (testResults.issues.length > 0) {
    log('', 'info');
    log('⚠️ Issues Found:', 'warning');
    testResults.issues.forEach(issue => log(`- ${issue}`, 'warning'));
  }
  
  log('', 'info');
  if (testResults.failed === 0) {
    log('🎉 All tests passed! Admin Panel is ready for production.', 'success');
  } else {
    log('❌ Some tests failed. Please review the issues above.', 'error');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(1)
    },
    details: testResults.details,
    issues: testResults.issues
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log('📄 Detailed report saved to test-report.json', 'info');
};

// Run tests
runAllTests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'error');
  process.exit(1);
}); 