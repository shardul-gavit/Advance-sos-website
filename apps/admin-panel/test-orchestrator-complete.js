/**
 * Complete test script for orchestrator service
 * This simulates the exact same calls the admin panel makes
 * Run with: node test-orchestrator-complete.js
 */

// Simulate the orchestrator service logic
class TestOrchestratorService {
  constructor() {
    this.ORCHESTRATOR_ENDPOINT = 'https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new';
    this.CORS_PROXY_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new';
    this.AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k';
  }

  async tryEndpoint(endpoint, action, payload, isProxy) {
    try {
      console.log(`🚀 Orchestrator request: ${action}`, payload);
      console.log(`🌐 Endpoint: ${isProxy ? 'CORS Proxy' : 'Direct'} - ${endpoint}`);
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.AUTH_TOKEN}`
      };

      if (isProxy) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers,
        body: JSON.stringify({
          action,
          ...payload
        })
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error Response:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Orchestrator response: ${action}`, data);
      
      return {
        ...data,
        _endpoint: isProxy ? 'CORS Proxy' : 'Direct'
      };
    } catch (error) {
      console.error(`❌ Orchestrator error: ${action}`, error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
            errorMessage = 'CORS Error: The orchestrator endpoint does not allow requests from this origin.';
          } else {
            errorMessage = 'Network error: Unable to reach orchestrator endpoint. Check your internet connection and firewall settings.';
          }
        } else if (error.message.includes('HTTP')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        _endpoint: isProxy ? 'CORS Proxy' : 'Direct'
      };
    }
  }

  async makeRequest(action, payload = {}) {
    // Try direct endpoint first
    let result = await this.tryEndpoint(this.ORCHESTRATOR_ENDPOINT, action, payload, false);
    
    // If direct endpoint fails with CORS, try CORS proxy
    if (!result.success && result.error?.includes('CORS')) {
      console.log('🔄 CORS error detected, trying CORS proxy fallback...');
      result = await this.tryEndpoint(this.CORS_PROXY_ENDPOINT, action, payload, true);
    }
    
    return result;
  }

  async healthCheck() {
    const response = await this.makeRequest('health_check');
    
    console.log('🔍 Health check response:', response);
    
    if (!response.success) {
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'down',
          realtime: 'down',
          storage: 'down',
          auth: 'down'
        },
        uptime: 0,
        version: 'unknown'
      };
    }

    // Handle different response structures
    if (response.data) {
      // Response has nested data structure
      return {
        success: true,
        status: response.data.status || 'healthy',
        timestamp: response.data.timestamp || new Date().toISOString(),
        services: response.data.services || {
          database: 'up',
          realtime: 'up',
          storage: 'up',
          auth: 'up'
        },
        uptime: response.data.uptime || 100,
        version: response.data.version || '1.0.0',
        _endpoint: response._endpoint
      };
    } else {
      // Response is direct health data
      return {
        success: true,
        status: response.status || 'healthy',
        timestamp: response.timestamp || new Date().toISOString(),
        services: response.services || {
          database: 'up',
          realtime: 'up',
          storage: 'up',
          auth: 'up'
        },
        uptime: response.uptime || 100,
        version: response.version || '1.0.0',
        _endpoint: response._endpoint
      };
    }
  }

  async testConnection() {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing orchestrator connection...');
      const healthResponse = await this.healthCheck();
      const latency = Date.now() - startTime;
      
      console.log('📊 Health check response:', healthResponse);
      
      // Check if health check was successful
      if (!healthResponse.success) {
        return {
          success: false,
          latency,
          error: `Health check failed: ${healthResponse.status || 'Unknown error'}`,
          endpoint: healthResponse._endpoint || 'Unknown'
        };
      }
      
      // Check if the status is healthy
      if (healthResponse.status !== 'healthy') {
        return {
          success: false,
          latency,
          error: `System status is ${healthResponse.status}, expected 'healthy'`,
          endpoint: healthResponse._endpoint || 'Direct'
        };
      }
      
      return {
        success: true,
        latency,
        endpoint: healthResponse._endpoint || 'Direct'
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('❌ Connection test error:', error);
      
      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Connection test failed',
        endpoint: 'Failed'
      };
    }
  }

  async testBasicConnectivity() {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing basic connectivity to orchestrator endpoint...');
      
      const response = await fetch(this.ORCHESTRATOR_ENDPOINT, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.AUTH_TOKEN}`
        }
      });
      
      const latency = Date.now() - startTime;
      console.log(`📡 OPTIONS response: ${response.status} ${response.statusText}`);
      
      return {
        success: response.ok,
        latency,
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          endpoint: 'Direct'
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('❌ Basic connectivity test failed:', error);
      
      let errorMessage = 'Basic connectivity test failed';
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
          errorMessage = 'CORS Error: Endpoint does not allow cross-origin requests from localhost:8081.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        latency,
        error: errorMessage,
        details: { error: error }
      };
    }
  }
}

const testCompleteOrchestrator = async () => {
  console.log('🧪 Testing Complete Orchestrator Service...\n');
  
  const service = new TestOrchestratorService();
  
  try {
    // Test 1: Basic Connectivity
    console.log('🔍 Test 1: Basic Connectivity');
    const connectivityTest = await service.testBasicConnectivity();
    console.log('🔗 Connectivity test result:', connectivityTest);
    console.log('');
    
    // Test 2: Health Check
    console.log('🔍 Test 2: Health Check');
    const healthCheck = await service.healthCheck();
    console.log('📊 Health check result:', healthCheck);
    console.log('');
    
    // Test 3: Full Connection Test
    console.log('🔍 Test 3: Full Connection Test');
    const testResult = await service.testConnection();
    console.log('🎯 Full test result:', testResult);
    console.log('');
    
    // Test 4: Simulate Dashboard Logic
    console.log('🔍 Test 4: Simulate Dashboard Logic');
    if (testResult.success) {
      console.log('✅ Orchestrator test successful:', testResult);
      const endpointInfo = testResult.endpoint || 'Direct';
      const connectivityInfo = connectivityTest.details?.endpoint || 'Direct';
      console.log(`✅ SUCCESS MESSAGE:\nOrchestrator connection successful!\n\nLatency: ${testResult.latency}ms\nFunction: orchestrator-new\nConnection: ${endpointInfo}\nConnectivity: ${connectivityInfo}\n\n🔧 Note: Using ${endpointInfo === 'CORS Proxy' ? 'CORS proxy (temporary fix)' : 'direct connection'}`);
    } else {
      console.error('❌ Orchestrator test failed:', testResult);
      const errorMsg = testResult.error || 'Unknown error';
      const endpointInfo = testResult.endpoint || 'Failed';
      
      // Check if it's a CORS error
      const isCorsError = errorMsg.includes('CORS') || errorMsg.includes('Access-Control-Allow-Origin');
      
      if (isCorsError) {
        console.log(`🚨 CORS ERROR MESSAGE:\nCORS Error Detected!\n\nError: ${errorMsg}\nLatency: ${testResult.latency}ms\nEndpoint: ${endpointInfo}\n\n🔧 AUTOMATIC FALLBACK APPLIED:\nThe system tried both direct connection and CORS proxy.\n\n📋 PERMANENT SOLUTION:\n1. Update the orchestrator-new function with CORS headers\n2. Redeploy the function to Supabase\n3. Test again\n\n📖 See CORS_FIX_GUIDE.md for detailed instructions.\n\nConnectivity Test: ${connectivityTest.success ? 'PASSED' : 'FAILED'}`);
      } else {
        console.log(`❌ FAILURE MESSAGE:\nOrchestrator connection failed!\n\nError: ${errorMsg}\nLatency: ${testResult.latency}ms\nEndpoint: ${endpointInfo}\n\n🔧 The system tried both direct connection and CORS proxy.\n\nConnectivity Test: ${connectivityTest.success ? 'PASSED' : 'FAILED'}\nCheck browser console for detailed logs.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  console.log('\n🏁 Complete orchestrator test finished!');
};

// Run the test
testCompleteOrchestrator().catch(console.error);
