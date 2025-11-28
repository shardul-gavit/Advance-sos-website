#!/usr/bin/env node

/**
 * Advance SOS System - Admin Panel Test Suite
 * 
 * This script tests the admin panel functionality including:
 * - Authentication
 * - Map visualization
 * - Real-time data sync
 * - Media handling
 * - Error scenarios
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: 'https://odkvcbnsimkhpmkllngo.supabase.co',
  supabaseKey: 'sb_publishable_TEqMgL9G9YLUxfcRpXvvtQ_WuhU82Hn',
  testEmail: 'test@advancesos.in',
  testPassword: 'testpass123',
  timeout: 10000
};

// Initialize Supabase client
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const recordTest = (testName, passed, details = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${testName} - ${details}`, 'error');
  }
  testResults.details.push({ name: testName, passed, details });
};

// Test functions
async function testDatabaseConnection() {
  try {
    log('Testing database connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      recordTest('Database Connection', false, error.message);
      return false;
    }
    
    recordTest('Database Connection', true);
    return true;
  } catch (error) {
    recordTest('Database Connection', false, error.message);
    return false;
  }
}

async function testTableExistence() {
  const tables = ['users', 'sos_events', 'helpers', 'responders', 'hospitals', 'media', 'locations'];
  let allTablesExist = true;
  
  log('Testing table existence...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        recordTest(`Table: ${table}`, false, error.message);
        allTablesExist = false;
      } else {
        recordTest(`Table: ${table}`, true);
      }
    } catch (error) {
      recordTest(`Table: ${table}`, false, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testAuthentication() {
  try {
    log('Testing authentication...');
    
    // Test sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword
    });
    
    if (signUpError) {
      recordTest('User Sign Up', false, signUpError.message);
    } else {
      recordTest('User Sign Up', true);
    }
    
    // Test sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword
    });
    
    if (signInError) {
      recordTest('User Sign In', false, signInError.message);
    } else {
      recordTest('User Sign In', true);
    }
    
    // Test session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      recordTest('Session Management', false, sessionError?.message || 'No session found');
    } else {
      recordTest('Session Management', true);
    }
    
    return true;
  } catch (error) {
    recordTest('Authentication', false, error.message);
    return false;
  }
}

async function testRealTimeSubscriptions() {
  try {
    log('Testing real-time subscriptions...');
    
    const channels = ['sos_events', 'helpers', 'responders', 'hospitals', 'media'];
    let allChannelsWorking = true;
    
    for (const channelName of channels) {
      try {
        const channel = supabase.channel(`test_${channelName}`)
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: channelName },
            (payload) => {
              log(`Real-time update received for ${channelName}:`, 'info');
            }
          )
          .subscribe();
        
        // Wait a bit to see if subscription works
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Unsubscribe
        await supabase.removeChannel(channel);
        
        recordTest(`Real-time: ${channelName}`, true);
      } catch (error) {
        recordTest(`Real-time: ${channelName}`, false, error.message);
        allChannelsWorking = false;
      }
    }
    
    return allChannelsWorking;
  } catch (error) {
    recordTest('Real-time Subscriptions', false, error.message);
    return false;
  }
}

async function testDataOperations() {
  try {
    log('Testing data operations...');
    
    // Test SOS event creation
    const testSOSEvent = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      emergency_type: 'medical',
      description: 'Test emergency',
      latitude: 22.3072,
      longitude: 73.1812,
      priority: 'medium',
      status: 'active'
    };
    
    const { data: sosData, error: sosError } = await supabase
      .from('sos_alerts')
      .insert(testSOSEvent)
      .select();
    
    if (sosError) {
      recordTest('SOS Event Creation', false, sosError.message);
    } else {
      recordTest('SOS Event Creation', true);
      
      // Test SOS event update
      const { error: updateError } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved' })
        .eq('id', sosData[0].id);
      
      if (updateError) {
        recordTest('SOS Event Update', false, updateError.message);
      } else {
        recordTest('SOS Event Update', true);
      }
      
      // Test SOS event deletion
      const { error: deleteError } = await supabase
        .from('sos_alerts')
        .delete()
        .eq('id', sosData[0].id);
      
      if (deleteError) {
        recordTest('SOS Event Deletion', false, deleteError.message);
      } else {
        recordTest('SOS Event Deletion', true);
      }
    }
    
    return true;
  } catch (error) {
    recordTest('Data Operations', false, error.message);
    return false;
  }
}

async function testStorageBuckets() {
  try {
    log('Testing storage buckets...');
    
    const buckets = ['media-images', 'media-videos', 'media-audio'];
    let allBucketsWorking = true;
    
    for (const bucketName of buckets) {
      try {
        const { data, error } = await supabase.storage.getBucket(bucketName);
        
        if (error) {
          recordTest(`Storage Bucket: ${bucketName}`, false, error.message);
          allBucketsWorking = false;
        } else {
          recordTest(`Storage Bucket: ${bucketName}`, true);
        }
      } catch (error) {
        recordTest(`Storage Bucket: ${bucketName}`, false, error.message);
        allBucketsWorking = false;
      }
    }
    
    return allBucketsWorking;
  } catch (error) {
    recordTest('Storage Buckets', false, error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  try {
    log('Testing environment variables...');
    
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_MAPBOX_TOKEN'
    ];
    
    let allVarsPresent = true;
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        recordTest(`Environment Variable: ${varName}`, false, 'Not set');
        allVarsPresent = false;
      } else {
        recordTest(`Environment Variable: ${varName}`, true);
      }
    }
    
    return allVarsPresent;
  } catch (error) {
    recordTest('Environment Variables', false, error.message);
    return false;
  }
}

async function testFileStructure() {
  try {
    log('Testing file structure...');
    
    const requiredFiles = [
      'src/pages/admin/dashboard.tsx',
      'src/lib/supabase.ts',
      'src/lib/services/api.ts',
      'src/lib/services/realtime.ts',
      'src/components/map/EnhancedAdminMap.tsx',
      'supabase_schema.sql'
    ];
    
    let allFilesPresent = true;
    
    for (const filePath of requiredFiles) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        recordTest(`File: ${filePath}`, true);
      } else {
        recordTest(`File: ${filePath}`, false, 'File not found');
        allFilesPresent = false;
      }
    }
    
    return allFilesPresent;
  } catch (error) {
    recordTest('File Structure', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Advance SOS System Admin Panel Tests...', 'info');
  log('================================================', 'info');
  
  // Run tests
  await testFileStructure();
  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testTableExistence();
  await testAuthentication();
  await testRealTimeSubscriptions();
  await testDataOperations();
  await testStorageBuckets();
  
  // Generate report
  log('================================================', 'info');
  log('📊 Test Results Summary:', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, 'error');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  
  // Save detailed results
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`Detailed report saved to: ${reportPath}`, 'info');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
}); 