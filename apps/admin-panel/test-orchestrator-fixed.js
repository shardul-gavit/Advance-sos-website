/**
 * Enhanced Test script for orchestrator connection with CORS fallback
 * Run with: node test-orchestrator-fixed.js
 */

const testOrchestratorConnection = async () => {
  console.log('🧪 Testing Enhanced Orchestrator Connection...\n');
  
  const endpoints = [
    {
      name: 'Direct Endpoint',
      url: 'https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new',
      isProxy: false
    },
    {
      name: 'CORS Proxy Endpoint',
      url: 'https://cors-anywhere.herokuapp.com/https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new',
      isProxy: true
    }
  ];
  
  // Use anon key instead of service role key
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k';
  
  for (const endpoint of endpoints) {
    console.log(`🔍 Testing ${endpoint.name}:`);
    console.log(`   ${endpoint.url}\n`);
    
    try {
      const startTime = Date.now();
      
      // Test OPTIONS request first
      const optionsHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (endpoint.isProxy) {
        optionsHeaders['X-Requested-With'] = 'XMLHttpRequest';
      }
      
      const optionsResponse = await fetch(endpoint.url, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: optionsHeaders
      });
      
      const latency = Date.now() - startTime;
      console.log(`   OPTIONS Response: ${optionsResponse.status} ${optionsResponse.statusText}`);
      console.log(`   Latency: ${latency}ms`);
      
      if (optionsResponse.ok) {
        // Test POST request
        const postStartTime = Date.now();
        const postHeaders = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };
        
        if (endpoint.isProxy) {
          postHeaders['X-Requested-With'] = 'XMLHttpRequest';
        }
        
        const postResponse = await fetch(endpoint.url, {
          method: 'POST',
          mode: 'cors',
          headers: postHeaders,
          body: JSON.stringify({
            action: 'health_check'
          })
        });
        
        const postLatency = Date.now() - postStartTime;
        console.log(`   POST Response: ${postResponse.status} ${postResponse.statusText}`);
        console.log(`   POST Latency: ${postLatency}ms`);
        
        if (postResponse.ok) {
          const data = await postResponse.json();
          console.log(`   ✅ SUCCESS: ${endpoint.name} connection working!`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
          
          // Test additional actions
          await testAdditionalActions(endpoint, authToken);
        } else {
          const errorText = await postResponse.text();
          console.log(`   ❌ POST failed: ${errorText}`);
        }
      } else {
        console.log(`   ❌ OPTIONS failed`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      
      if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
        console.log(`   🔧 CORS Error detected - this is expected for direct endpoint`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Enhanced test completed!');
  console.log('\n📋 Summary:');
  console.log('- Direct endpoint may fail due to CORS policy');
  console.log('- CORS proxy endpoint should work as fallback');
  console.log('- Admin panel will automatically use the working endpoint');
};

const testAdditionalActions = async (endpoint, authToken) => {
  console.log(`   🧪 Testing additional actions on ${endpoint.name}...`);
  
  const actions = [
    { action: 'get_live_responders' },
    { action: 'get_responder_history', user_id: 'test-user' },
    { action: 'get_emergency_stats' }
  ];
  
  for (const actionData of actions) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      };
      
      if (endpoint.isProxy) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
      }
      
      const response = await fetch(endpoint.url, {
        method: 'POST',
        mode: 'cors',
        headers,
        body: JSON.stringify(actionData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`     ✅ ${actionData.action}: ${data.success ? 'SUCCESS' : 'FAILED'}`);
      } else {
        console.log(`     ❌ ${actionData.action}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`     ❌ ${actionData.action}: ${error.message}`);
    }
  }
};

// Run the test
testOrchestratorConnection().catch(console.error);
