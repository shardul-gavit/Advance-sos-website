/**
 * Test script to verify health check response structure
 * Run with: node test-health-check.js
 */

const testHealthCheck = async () => {
  console.log('🧪 Testing Health Check Response Structure...\n');
  
  const endpoint = 'https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new';
  const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k';
  
  try {
    console.log('🔍 Testing health check endpoint...');
    console.log(`   ${endpoint}\n`);
    
    const startTime = Date.now();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        action: 'health_check'
      })
    });
    
    const latency = Date.now() - startTime;
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`   Latency: ${latency}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS: Health check response received!`);
      console.log(`   Response structure:`, JSON.stringify(data, null, 2));
      
      // Analyze response structure
      console.log('\n🔍 Response Structure Analysis:');
      console.log(`   - success: ${data.success}`);
      console.log(`   - data exists: ${!!data.data}`);
      console.log(`   - status: ${data.data?.status || data.status || 'N/A'}`);
      console.log(`   - service: ${data.data?.service || data.service || 'N/A'}`);
      console.log(`   - database: ${data.data?.database || data.database || 'N/A'}`);
      console.log(`   - timestamp: ${data.data?.timestamp || data.timestamp || 'N/A'}`);
      
      // Test the logic that was causing the issue
      console.log('\n🧪 Testing Health Check Logic:');
      
      if (!data.success) {
        console.log('   ❌ Response.success is false - this would cause failure');
      } else {
        console.log('   ✅ Response.success is true - this should work');
        
        if (data.data) {
          console.log('   ✅ Response has nested data structure');
          console.log(`   ✅ Status from data: ${data.data.status}`);
        } else {
          console.log('   ✅ Response is direct health data');
          console.log(`   ✅ Status from response: ${data.status}`);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Health check failed: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
  
  console.log('\n🏁 Health check test completed!');
};

// Run the test
testHealthCheck().catch(console.error);
