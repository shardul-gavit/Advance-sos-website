/**
 * Test script for orchestrator connection
 * Run with: node test-orchestrator.js
 */

const testOrchestratorConnection = async () => {
  console.log('🧪 Testing Orchestrator Connection...\n');
  
  const endpoints = [
    'https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new',
    'https://cors-anywhere.herokuapp.com/https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new'
  ];
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const isProxy = i === 1;
    
    console.log(`🔍 Testing ${isProxy ? 'CORS Proxy' : 'Direct'} endpoint:`);
    console.log(`   ${endpoint}\n`);
    
    try {
      const startTime = Date.now();
      
      // Test OPTIONS request first
      const optionsResponse = await fetch(endpoint, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI1MjYzMiwiZXhwIjoyMDY3ODI4NjMyfQ.0qanU4VHNkQLYIWSkDw8kimy0jG0X72MkB5FXRWiRBo',
          ...(isProxy && { 'X-Requested-With': 'XMLHttpRequest' })
        }
      });
      
      const latency = Date.now() - startTime;
      console.log(`   OPTIONS Response: ${optionsResponse.status} ${optionsResponse.statusText}`);
      console.log(`   Latency: ${latency}ms`);
      
      if (optionsResponse.ok) {
        // Test POST request
        const postStartTime = Date.now();
        const postResponse = await fetch(endpoint, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI1MjYzMiwiZXhwIjoyMDY3ODI4NjMyfQ.0qanU4VHNkQLYIWSkDw8kimy0jG0X72MkB5FXRWiRBo',
            ...(isProxy && { 'X-Requested-With': 'XMLHttpRequest' })
          },
          body: JSON.stringify({
            action: 'health_check'
          })
        });
        
        const postLatency = Date.now() - postStartTime;
        console.log(`   POST Response: ${postResponse.status} ${postResponse.statusText}`);
        console.log(`   POST Latency: ${postLatency}ms`);
        
        if (postResponse.ok) {
          const data = await postResponse.json();
          console.log(`   ✅ SUCCESS: ${isProxy ? 'CORS Proxy' : 'Direct'} connection working!`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
        } else {
          const errorText = await postResponse.text();
          console.log(`   ❌ POST failed: ${errorText}`);
        }
      } else {
        console.log(`   ❌ OPTIONS failed`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Test completed!');
};

// Run the test
testOrchestratorConnection().catch(console.error);
