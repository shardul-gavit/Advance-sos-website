/**
 * Unified Orchestrator Service
 * Connects to the world's most powerful SOS orchestrator
 * 
 * Function: orchestrator-new
 * Endpoint: https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new
 */

export interface OrchestratorResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    realtime: 'up' | 'down';
    storage: 'up' | 'down';
    auth: 'up' | 'down';
  };
  uptime: number;
  version: string;
}

export interface EmergencyStatusResponse {
  success: boolean;
  sos_id: string;
  status: 'active' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  emergency_type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  user_id: string;
  assigned_helper_id?: string;
  assigned_responder_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  media_count: number;
  has_live_stream: boolean;
}

export interface StatusUpdateResponse {
  success: boolean;
  sos_id: string;
  previous_status: string;
  new_status: string;
  message: string;
  updated_at: string;
}

export interface EndEmergencyResponse {
  success: boolean;
  sos_id: string;
  status: 'resolved';
  resolution_notes: string;
  resolved_at: string;
  response_time: number; // in seconds
  error?: string;
}

class OrchestratorService {
  // Primary endpoint
  private readonly ORCHESTRATOR_ENDPOINT = 'https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new';
  
  // Fallback CORS proxy endpoint
  private readonly CORS_PROXY_ENDPOINT = 'https://cors-anywhere.herokuapp.com/https://odkvcbnsimkhpmkllngo.supabase.co/functions/v1/orchestrator-new';
  
  // Use anon key instead of service role key for better compatibility
  private readonly AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k';

  /**
   * Make a request to the orchestrator with fallback support
   */
  private async makeRequest(action: string, payload: any = {}): Promise<OrchestratorResponse> {
    // Try direct endpoint first
    let result = await this.tryEndpoint(this.ORCHESTRATOR_ENDPOINT, action, payload, false);
    
    // If direct endpoint fails with CORS, try CORS proxy
    if (!result.success && result.error?.includes('CORS')) {
      console.log('🔄 CORS error detected, trying CORS proxy fallback...');
      result = await this.tryEndpoint(this.CORS_PROXY_ENDPOINT, action, payload, true);
    }
    
    return result;
  }

  /**
   * Try a specific endpoint
   */
  private async tryEndpoint(endpoint: string, action: string, payload: any, isProxy: boolean): Promise<OrchestratorResponse> {
    try {
      console.log(`🚀 Orchestrator request: ${action}`, payload);
      console.log(`🌐 Endpoint: ${isProxy ? 'CORS Proxy' : 'Direct'} - ${endpoint}`);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.AUTH_TOKEN}`
      };

      // Add proxy-specific headers
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

  /**
   * Health Check - System health monitoring
   */
  async healthCheck(): Promise<HealthCheckResponse> {
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
        version: response.data.version || '1.0.0'
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
        version: response.version || '1.0.0'
      };
    }
  }

  /**
   * Get Emergency Status - Get emergency status by SOS ID
   */
  async getEmergencyStatus(sosId: string): Promise<EmergencyStatusResponse> {
    const response = await this.makeRequest('get_status', { sos_id: sosId });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get emergency status');
    }

    return response.data || response;
  }

  /**
   * Update Emergency Status - Update emergency status with message
   */
  async updateEmergencyStatus(
    sosId: string, 
    status: 'active' | 'in_progress' | 'resolved' | 'cancelled',
    message: string
  ): Promise<StatusUpdateResponse> {
    const response = await this.makeRequest('status_update', {
      sos_id: sosId,
      status,
      message
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update emergency status');
    }

    return response.data || response;
  }

  /**
   * End Emergency - Resolve emergency with resolution notes
   */
  async endEmergency(sosId: string, resolutionNotes: string): Promise<EndEmergencyResponse> {
    const response = await this.makeRequest('end_emergency', {
      sos_id: sosId,
      resolution_notes: resolutionNotes
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to end emergency');
    }

    return response.data || response;
  }

  /**
   * Test orchestrator connection
   */
  async testConnection(): Promise<{ success: boolean; latency: number; error?: string; endpoint?: string }> {
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
          endpoint: (healthResponse as any)._endpoint || 'Unknown'
        };
      }
      
      // Check if the status is healthy
      if (healthResponse.status !== 'healthy') {
        return {
          success: false,
          latency,
          error: `System status is ${healthResponse.status}, expected 'healthy'`,
          endpoint: (healthResponse as any)._endpoint || 'Direct'
        };
      }
      
      return {
        success: true,
        latency,
        endpoint: (healthResponse as any)._endpoint || 'Direct'
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

  /**
   * Get orchestrator endpoint for display purposes
   */
  getEndpoint(): string {
    return this.ORCHESTRATOR_ENDPOINT;
  }

  /**
   * Get orchestrator function name
   */
  getFunctionName(): string {
    return 'orchestrator-new';
  }

  /**
   * Test basic connectivity to the endpoint
   */
  async testBasicConnectivity(): Promise<{ success: boolean; latency: number; error?: string; details?: any }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Testing basic connectivity to orchestrator endpoint...');
      
      // Try a simple OPTIONS request first to test connectivity
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

// Export singleton instance
export const orchestratorService = new OrchestratorService();
export default orchestratorService;
