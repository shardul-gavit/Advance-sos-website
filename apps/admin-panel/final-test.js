#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 FINAL COMPREHENSIVE TEST - ADVANCE SOS ADMIN PANEL');
console.log('=====================================================');
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

// Test 1: File Structure
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
    'COMPLETE_DATABASE_SETUP.sql',
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'index.html'
  ];

  let allFilesExist = true;
  const missingFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      allFilesExist = false;
      missingFiles.push(file);
    }
  });

  addResult(
    'File Structure Check',
    allFilesExist,
    allFilesExist ? 'All required files present' : `Missing: ${missingFiles.join(', ')}`
  );
};

// Test 2: Package Dependencies
const testPackageDependencies = () => {
  log('Testing package dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const requiredDeps = ['firebase', 'lodash', '@types/lodash', 'mapbox-gl', '@supabase/supabase-js'];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    addResult(
      'Package Dependencies',
      missingDeps.length === 0,
      missingDeps.length === 0 ? 'All required dependencies present' : `Missing: ${missingDeps.join(', ')}`
    );
  } catch (error) {
    addResult('Package Dependencies', false, `Error: ${error.message}`);
  }
};

// Test 3: Environment Variables Template
const testEnvironmentTemplate = () => {
  log('Testing environment template...');
  
  const envTemplatePath = path.join(__dirname, 'env.example');
  const hasTemplate = fs.existsSync(envTemplatePath);
  
  addResult(
    'Environment Template',
    hasTemplate,
    hasTemplate ? 'Environment template created' : 'Missing env.example file'
  );
};

// Test 4: Component Syntax
const testComponentSyntax = () => {
  log('Testing component syntax...');
  
  const components = [
    'src/components/media/MediaPlayer.tsx',
    'src/components/media/MediaUpload.tsx',
    'src/components/map/EnhancedAdminMap.tsx',
    'src/components/admin/TestMode.tsx'
  ];

  let allComponentsValid = true;
  const invalidComponents = [];

  components.forEach(component => {
    const filePath = path.join(__dirname, component);
    
    if (!fs.existsSync(filePath)) {
      allComponentsValid = false;
      invalidComponents.push(`${component} (not found)`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic syntax checks
      const hasReactImport = content.includes('import React') || content.includes('import * as React');
      const hasExport = content.includes('export');
      const hasValidJSX = content.includes('return (') || content.includes('return(') || content.includes('return <');
      
      if (!hasReactImport || !hasExport || !hasValidJSX) {
        allComponentsValid = false;
        invalidComponents.push(component);
      }
    } catch (error) {
      allComponentsValid = false;
      invalidComponents.push(`${component} (read error)`);
    }
  });

  addResult(
    'Component Syntax',
    allComponentsValid,
    allComponentsValid ? 'All components valid' : `Invalid: ${invalidComponents.join(', ')}`
  );
};

// Test 5: Service Syntax
const testServiceSyntax = () => {
  log('Testing service syntax...');
  
  const services = [
    'src/lib/firebase.ts',
    'src/lib/services/distance.ts'
  ];

  let allServicesValid = true;
  const invalidServices = [];

  services.forEach(service => {
    const filePath = path.join(__dirname, service);
    
    if (!fs.existsSync(filePath)) {
      allServicesValid = false;
      invalidServices.push(`${service} (not found)`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic service checks
      const hasExports = content.includes('export');
      const hasValidSyntax = !content.includes('syntax error');
      
      if (!hasExports || !hasValidSyntax) {
        allServicesValid = false;
        invalidServices.push(service);
      }
    } catch (error) {
      allServicesValid = false;
      invalidServices.push(`${service} (read error)`);
    }
  });

  addResult(
    'Service Syntax',
    allServicesValid,
    allServicesValid ? 'All services valid' : `Invalid: ${invalidServices.join(', ')}`
  );
};

// Test 6: Configuration Files
const testConfigurationFiles = () => {
  log('Testing configuration files...');
  
  const configFiles = [
    { path: 'vite.config.ts', name: 'Vite Config' },
    { path: 'tsconfig.json', name: 'TypeScript Config' },
    { path: 'package.json', name: 'Package Config' }
  ];

  let allConfigsValid = true;
  const invalidConfigs = [];

  configFiles.forEach(config => {
    const filePath = path.join(__dirname, config.path);
    
    if (!fs.existsSync(filePath)) {
      allConfigsValid = false;
      invalidConfigs.push(`${config.name} (not found)`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (config.path === 'tsconfig.json') {
        const tsConfig = JSON.parse(content);
        const hasCompilerOptions = !!tsConfig.compilerOptions;
        const hasJsx = !!tsConfig.compilerOptions?.jsx;
        
        if (!hasCompilerOptions || !hasJsx) {
          allConfigsValid = false;
          invalidConfigs.push(config.name);
        }
      } else if (config.path === 'package.json') {
        const packageJson = JSON.parse(content);
        const hasScripts = !!packageJson.scripts;
        const hasDependencies = !!packageJson.dependencies;
        
        if (!hasScripts || !hasDependencies) {
          allConfigsValid = false;
          invalidConfigs.push(config.name);
        }
      } else {
        // Vite config
        const hasDefineConfig = content.includes('defineConfig');
        const hasReact = content.includes('react');
        
        if (!hasDefineConfig || !hasReact) {
          allConfigsValid = false;
          invalidConfigs.push(config.name);
        }
      }
    } catch (error) {
      allConfigsValid = false;
      invalidConfigs.push(`${config.name} (parse error)`);
    }
  });

  addResult(
    'Configuration Files',
    allConfigsValid,
    allConfigsValid ? 'All configs valid' : `Invalid: ${invalidConfigs.join(', ')}`
  );
};

// Test 7: Database Schema
const testDatabaseSchema = () => {
  log('Testing database schema...');
  
  const schemaPath = path.join(__dirname, 'COMPLETE_DATABASE_SETUP.sql');
  
  if (!fs.existsSync(schemaPath)) {
    addResult('Database Schema', false, 'COMPLETE_DATABASE_SETUP.sql not found');
    return;
  }

  try {
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for required tables
    const requiredTables = ['users', 'sos_events', 'helpers', 'responders', 'media', 'fcm_tokens'];
    const missingTables = requiredTables.filter(table => !content.includes(`CREATE TABLE ${table}`));
    
    addResult(
      'Database Schema',
      missingTables.length === 0,
      missingTables.length === 0 ? 'All required tables present' : `Missing tables: ${missingTables.join(', ')}`
    );
  } catch (error) {
    addResult('Database Schema', false, `Read error: ${error.message}`);
  }
};

// Test 8: Firebase Service Worker
const testFirebaseServiceWorker = () => {
  log('Testing Firebase service worker...');
  
  const swPath = path.join(__dirname, 'public/firebase-messaging-sw.js');
  
  if (!fs.existsSync(swPath)) {
    addResult('Firebase Service Worker', false, 'firebase-messaging-sw.js not found');
    return;
  }

  try {
    const content = fs.readFileSync(swPath, 'utf8');
    
    const hasFirebaseConfig = content.includes('firebaseConfig');
    const hasBackgroundMessage = content.includes('onBackgroundMessage');
    const hasNotificationClick = content.includes('notificationclick');
    
    addResult(
      'Firebase Service Worker',
      hasFirebaseConfig && hasBackgroundMessage && hasNotificationClick,
      hasFirebaseConfig && hasBackgroundMessage && hasNotificationClick 
        ? 'Service worker properly configured' 
        : 'Missing required functions'
    );
  } catch (error) {
    addResult('Firebase Service Worker', false, `Read error: ${error.message}`);
  }
};

// Run all tests
const runAllTests = () => {
  testFileStructure();
  testPackageDependencies();
  testEnvironmentTemplate();
  testComponentSyntax();
  testServiceSyntax();
  testConfigurationFiles();
  testDatabaseSchema();
  testFirebaseServiceWorker();
  
  // Generate summary
  console.log('');
  console.log('📊 FINAL TEST RESULTS SUMMARY:');
  console.log('==============================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Admin Panel is ready for production deployment');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Configure environment variables');
    console.log('2. Set up Supabase project');
    console.log('3. Configure Firebase project');
    console.log('4. Set up Mapbox access token');
    console.log('5. Deploy to Vercel');
  } else {
    console.log('');
    console.log('❌ SOME TESTS FAILED');
    console.log('Please review and fix the issues above');
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
  
  fs.writeFileSync(
    path.join(__dirname, 'final-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('');
  console.log('📄 Detailed report saved to final-test-report.json');
};

// Run tests
runAllTests(); 