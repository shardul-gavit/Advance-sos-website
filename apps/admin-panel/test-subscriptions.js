#!/usr/bin/env node

/**
 * Comprehensive Real-Time Subscription Test Script
 * Tests all subscription types and configurations in the admin panel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Real-Time Subscriptions Configuration...\n');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addTest(name, status, message, details = null) {
  testResults.tests.push({
    name,
    status, // 'pass', 'fail', 'warning'
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  testResults.summary.total++;
  if (status === 'pass') testResults.summary.passed++;
  else if (status === 'fail') testResults.summary.failed++;
  else if (status === 'warning') testResults.summary.warnings++;
  
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) console.log(`   Details: ${details}`);
}

// Test 1: Check RealtimeService configuration
try {
  const realtimeServicePath = path.join(__dirname, 'src', 'lib', 'services', 'realtime.ts');
  const realtimeContent = fs.readFileSync(realtimeServicePath, 'utf8');
  
  // Check for correct table names
  const hasSosAlerts = realtimeContent.includes("table: 'sos_alerts'");
  const hasSosMedia = realtimeContent.includes("table: 'sos_media'");
  const noSosEvents = !realtimeContent.includes("table: 'sos_events'");
  const noMediaTable = !realtimeContent.includes("table: 'media'");
  
  if (hasSosAlerts && hasSosMedia && noSosEvents && noMediaTable) {
    addTest('RealtimeService Table Names', 'pass', 'All table names are correct');
  } else {
    addTest('RealtimeService Table Names', 'fail', 'Incorrect table names found', 
      `sos_alerts: ${hasSosAlerts}, sos_media: ${hasSosMedia}, sos_events: ${!noSosEvents}, media: ${!noMediaTable}`);
  }
  
  // Check channel names
  const hasCorrectChannels = realtimeContent.includes("'sos_alerts_changes'") && 
                           realtimeContent.includes("'sos_media_changes'");
  
  if (hasCorrectChannels) {
    addTest('RealtimeService Channel Names', 'pass', 'Channel names are consistent');
  } else {
    addTest('RealtimeService Channel Names', 'fail', 'Inconsistent channel names');
  }
  
} catch (error) {
  addTest('RealtimeService Configuration', 'fail', 'Could not read RealtimeService file', error.message);
}

// Test 2: Check SOSDataService subscription method
try {
  const sosDataServicePath = path.join(__dirname, 'src', 'lib', 'services', 'sosDataService.ts');
  const sosDataContent = fs.readFileSync(sosDataServicePath, 'utf8');
  
  const hasSubscribeMethod = sosDataContent.includes('subscribeToSOSAlerts');
  const hasCorrectTable = sosDataContent.includes("table: 'sos_alerts'");
  const hasCorrectChannel = sosDataContent.includes("'sos_alerts_changes'");
  
  if (hasSubscribeMethod && hasCorrectTable && hasCorrectChannel) {
    addTest('SOSDataService Subscription', 'pass', 'Subscription method is properly configured');
  } else {
    addTest('SOSDataService Subscription', 'fail', 'Subscription method has issues',
      `Method: ${hasSubscribeMethod}, Table: ${hasCorrectTable}, Channel: ${hasCorrectChannel}`);
  }
  
} catch (error) {
  addTest('SOSDataService Configuration', 'fail', 'Could not read SOSDataService file', error.message);
}

// Test 3: Check Main Dashboard subscriptions
try {
  const dashboardPath = path.join(__dirname, 'src', 'pages', 'admin', 'dashboard.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const hasSosAlertsSub = dashboardContent.includes("table: 'sos_alerts'");
  const hasSosMediaSub = dashboardContent.includes("table: 'sos_media'");
  const hasEventHandling = dashboardContent.includes('payload.eventType');
  
  if (hasSosAlertsSub && hasSosMediaSub && hasEventHandling) {
    addTest('Main Dashboard Subscriptions', 'pass', 'Dashboard has proper real-time subscriptions');
  } else {
    addTest('Main Dashboard Subscriptions', 'fail', 'Dashboard subscription issues',
      `SOS Alerts: ${hasSosAlertsSub}, SOS Media: ${hasSosMediaSub}, Event Handling: ${hasEventHandling}`);
  }
  
} catch (error) {
  addTest('Main Dashboard Configuration', 'fail', 'Could not read dashboard file', error.message);
}

// Test 4: Check SOS History Dashboard subscriptions
try {
  const historyDashboardPath = path.join(__dirname, 'src', 'pages', 'admin', 'sos-history-dashboard.tsx');
  const historyContent = fs.readFileSync(historyDashboardPath, 'utf8');
  
  const usesSOSDataService = historyContent.includes('SOSDataService.subscribeToSOSAlerts');
  const hasEventHandling = historyContent.includes('payload.eventType');
  const hasCleanup = historyContent.includes('subscription.unsubscribe()');
  
  if (usesSOSDataService && hasEventHandling && hasCleanup) {
    addTest('SOS History Dashboard Subscriptions', 'pass', 'History dashboard uses correct subscription service');
  } else {
    addTest('SOS History Dashboard Subscriptions', 'fail', 'History dashboard subscription issues',
      `Uses SOSDataService: ${usesSOSDataService}, Event Handling: ${hasEventHandling}, Cleanup: ${hasCleanup}`);
  }
  
} catch (error) {
  addTest('SOS History Dashboard Configuration', 'fail', 'Could not read history dashboard file', error.message);
}

// Test 5: Check RealtimeSOSDashboard subscriptions
try {
  const realtimeDashboardPath = path.join(__dirname, 'src', 'components', 'admin', 'RealtimeSOSDashboard.tsx');
  const realtimeContent = fs.readFileSync(realtimeDashboardPath, 'utf8');
  
  const usesSOSDataService = realtimeContent.includes('SOSDataService.subscribeToSOSAlerts');
  const hasEventHandling = realtimeContent.includes('payload.eventType');
  const hasCleanup = realtimeContent.includes('subscription.unsubscribe()');
  
  if (usesSOSDataService && hasEventHandling && hasCleanup) {
    addTest('RealtimeSOSDashboard Subscriptions', 'pass', 'Realtime dashboard uses correct subscription service');
  } else {
    addTest('RealtimeSOSDashboard Subscriptions', 'fail', 'Realtime dashboard subscription issues',
      `Uses SOSDataService: ${usesSOSDataService}, Event Handling: ${hasEventHandling}, Cleanup: ${hasCleanup}`);
  }
  
} catch (error) {
  addTest('RealtimeSOSDashboard Configuration', 'fail', 'Could not read realtime dashboard file', error.message);
}

// Test 6: Check HLS Player Dashboard subscriptions
try {
  const hlsDashboardPath = path.join(__dirname, 'src', 'components', 'admin', 'HLSPlayerDashboard.tsx');
  const hlsContent = fs.readFileSync(hlsDashboardPath, 'utf8');
  
  const hasSosAlertsSub = hlsContent.includes("table: 'sos_alerts'");
  const hasSosMediaSub = hlsContent.includes("table: 'sos_media'");
  const hasCleanup = hlsContent.includes('unsubscribe()');
  
  if (hasSosAlertsSub && hasSosMediaSub && hasCleanup) {
    addTest('HLS Player Dashboard Subscriptions', 'pass', 'HLS player has proper subscriptions');
  } else {
    addTest('HLS Player Dashboard Subscriptions', 'fail', 'HLS player subscription issues',
      `SOS Alerts: ${hasSosAlertsSub}, SOS Media: ${hasSosMediaSub}, Cleanup: ${hasCleanup}`);
  }
  
} catch (error) {
  addTest('HLS Player Dashboard Configuration', 'fail', 'Could not read HLS player dashboard file', error.message);
}

// Test 7: Check for subscription consistency
try {
  const files = [
    'src/lib/services/realtime.ts',
    'src/lib/services/sosDataService.ts',
    'src/pages/admin/dashboard.tsx',
    'src/pages/admin/sos-history-dashboard.tsx',
    'src/components/admin/RealtimeSOSDashboard.tsx',
    'src/components/admin/HLSPlayerDashboard.tsx'
  ];
  
  let consistentChannels = true;
  let consistentTables = true;
  const foundChannels = new Set();
  const foundTables = new Set();
  
  files.forEach(file => {
    try {
      const filePath = path.join(__dirname, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract channel names
      const channelMatches = content.match(/'([^']*_changes)'/g);
      if (channelMatches) {
        channelMatches.forEach(match => {
          foundChannels.add(match.replace(/'/g, ''));
        });
      }
      
      // Extract table names
      const tableMatches = content.match(/table:\s*'([^']*)'/g);
      if (tableMatches) {
        tableMatches.forEach(match => {
          const tableName = match.match(/table:\s*'([^']*)'/)[1];
          foundTables.add(tableName);
        });
      }
    } catch (error) {
      // File might not exist, skip
    }
  });
  
  // Check for expected channels and tables
  const expectedChannels = ['sos_alerts_changes', 'sos_media_changes'];
  const expectedTables = ['sos_alerts', 'sos_media'];
  const unexpectedTables = ['sos_events', 'media'];
  
  expectedChannels.forEach(channel => {
    if (!foundChannels.has(channel)) {
      consistentChannels = false;
    }
  });
  
  expectedTables.forEach(table => {
    if (!foundTables.has(table)) {
      consistentTables = false;
    }
  });
  
  unexpectedTables.forEach(table => {
    if (foundTables.has(table)) {
      consistentTables = false;
    }
  });
  
  if (consistentChannels && consistentTables) {
    addTest('Subscription Consistency', 'pass', 'All subscriptions use consistent naming');
  } else {
    addTest('Subscription Consistency', 'fail', 'Inconsistent subscription naming',
      `Channels: ${Array.from(foundChannels).join(', ')}, Tables: ${Array.from(foundTables).join(', ')}`);
  }
  
} catch (error) {
  addTest('Subscription Consistency Check', 'fail', 'Could not check consistency', error.message);
}

// Test 8: Check for proper error handling
try {
  const realtimeServicePath = path.join(__dirname, 'src', 'lib', 'services', 'realtime.ts');
  const realtimeContent = fs.readFileSync(realtimeServicePath, 'utf8');
  
  const hasErrorHandling = realtimeContent.includes('try') && realtimeContent.includes('catch');
  const hasUnsubscribe = realtimeContent.includes('unsubscribe()');
  const hasChannelCleanup = realtimeContent.includes('removeChannel');
  
  if (hasErrorHandling && hasUnsubscribe && hasChannelCleanup) {
    addTest('Error Handling & Cleanup', 'pass', 'Proper error handling and cleanup implemented');
  } else {
    addTest('Error Handling & Cleanup', 'warning', 'Missing some error handling or cleanup',
      `Error Handling: ${hasErrorHandling}, Unsubscribe: ${hasUnsubscribe}, Channel Cleanup: ${hasChannelCleanup}`);
  }
  
} catch (error) {
  addTest('Error Handling Check', 'fail', 'Could not check error handling', error.message);
}

// Test 9: Check for subscription types coverage
const subscriptionTypes = [
  'sos_alerts',
  'sos_media', 
  'helpers',
  'responders',
  'hospitals',
  'users',
  'locations'
];

subscriptionTypes.forEach(type => {
  try {
    const realtimeServicePath = path.join(__dirname, 'src', 'lib', 'services', 'realtime.ts');
    const realtimeContent = fs.readFileSync(realtimeServicePath, 'utf8');
    
    const hasSubscription = realtimeContent.includes(`table: '${type}'`);
    const hasMethod = realtimeContent.includes(`subscribeTo${type.charAt(0).toUpperCase() + type.slice(1)}`);
    
    if (hasSubscription && hasMethod) {
      addTest(`${type} Subscription Coverage`, 'pass', `${type} subscription is implemented`);
    } else {
      addTest(`${type} Subscription Coverage`, 'warning', `${type} subscription missing or incomplete`,
        `Table: ${hasSubscription}, Method: ${hasMethod}`);
    }
  } catch (error) {
    addTest(`${type} Subscription Coverage`, 'fail', `Could not check ${type} subscription`, error.message);
  }
});

// Generate summary
console.log('\n📊 Test Summary:');
console.log(`Total Tests: ${testResults.summary.total}`);
console.log(`✅ Passed: ${testResults.summary.passed}`);
console.log(`❌ Failed: ${testResults.summary.failed}`);
console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);

// Calculate success rate
const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
console.log(`\n🎯 Success Rate: ${successRate}%`);

// Save results
const reportPath = path.join(__dirname, 'subscription-test-report.json');
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Recommendations
console.log('\n💡 Recommendations:');
if (testResults.summary.failed > 0) {
  console.log('❌ Fix failed tests before deploying to production');
}
if (testResults.summary.warnings > 0) {
  console.log('⚠️  Address warnings to improve reliability');
}
if (successRate >= 90) {
  console.log('✅ Excellent! Your subscription configuration is well-structured');
} else if (successRate >= 70) {
  console.log('⚠️  Good, but there are some issues to address');
} else {
  console.log('❌ Critical issues found. Review and fix before proceeding');
}

console.log('\n🔧 Next Steps:');
console.log('1. Fix any failed tests');
console.log('2. Address warnings for better reliability');
console.log('3. Test real-time functionality in development');
console.log('4. Monitor subscription performance in production');

process.exit(testResults.summary.failed > 0 ? 1 : 0);
