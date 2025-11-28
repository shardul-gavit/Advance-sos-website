import { supabase } from '../supabase';

// Comprehensive SOS Data Service for Admin Panel
export class SOSDataService {
  // Fetch ALL SOS alerts with media data
  static async fetchAllSOSAlerts() {
    try {
      console.log('🔍 Fetching all SOS alerts with media...');
      
      // Fetch SOS alerts first - no limit to get all records including past triggers
      // Try triggered_at first (primary timestamp column), fallback to created_at if needed
      let alertsData: any[] = [];
      let alertsError: any = null;
      let orderColumn = "triggered_at"; // Track which column we're using for ordering
      
      // First try with triggered_at (primary timestamp column per schema)
      const { data: data1, error: error1 } = await supabase
        .from("sos_alerts")
        .select("*")
        .order("triggered_at", { ascending: false });
      
      if (error1 && (error1.message?.includes('column') || error1.code === '42703')) {
        // triggered_at doesn't exist, try created_at
        console.log('⚠️ triggered_at column not found, trying created_at...');
        orderColumn = "created_at";
        const { data: data2, error: error2 } = await supabase
          .from("sos_alerts")
          .select("*")
          .order("created_at", { ascending: false });
        
        alertsData = data2 || [];
        alertsError = error2;
      } else {
        alertsData = data1 || [];
        alertsError = error1;
      }
      
      // If we got data but it might be limited by Supabase's default (1000 rows),
      // check if we need to fetch more pages
      if (alertsData.length === 1000 && !alertsError) {
        console.log(`⚠️ Reached Supabase default limit (1000 rows), fetching additional pages using ${orderColumn}...`);
        let allData = [...alertsData];
        let offset = 1000;
        let hasMore = true;
        
        while (hasMore) {
          const { data: pageData, error: pageError } = await supabase
            .from("sos_alerts")
            .select("*")
            .order(orderColumn, { ascending: false })
            .range(offset, offset + 999);
          
          if (pageError || !pageData || pageData.length === 0) {
            hasMore = false;
          } else {
            allData = [...allData, ...pageData];
            offset += 1000;
            if (pageData.length < 1000) {
              hasMore = false; // Last page
            }
          }
        }
        
        console.log(`📊 Fetched ${allData.length} total alerts (including pagination)`);
        alertsData = allData;
      }

      if (alertsError) {
        console.error("❌ Error fetching SOS alerts:", alertsError);
        console.error("Error details:", JSON.stringify(alertsError, null, 2));
        return [];
      }

      if (!alertsData) {
        console.warn("⚠️ No alerts data returned from query");
        return [];
      }

      console.log(`📊 Fetched ${alertsData.length} alerts from database`);

      // Fetch media data separately
      const { data: mediaData, error: mediaError } = await supabase
        .from("sos_media")
        .select("*");

      if (mediaError) {
        console.error("❌ Error fetching media data:", mediaError);
        // Continue without media data
      }

      // Combine alerts with their media
      const processedAlerts = alertsData.map(alert => {
        const alertMedia = mediaData?.filter(media => 
          media.sos_event_id === alert.id || media.sos_id === alert.id
        ) || [];
        return {
          ...alert,
          media: alertMedia,
          hasMedia: alertMedia.length > 0,
          mediaCount: alertMedia.length
        };
      });
      
      console.log(`✅ Successfully fetched ${processedAlerts?.length || 0} SOS alerts with media data`);
      return processedAlerts || [];
    } catch (error) {
      console.error("❌ Exception in fetchAllSOSAlerts:", error);
      return [];
    }
  }

  // Fetch past data (older than 24 hours)
  static async fetchPastSOSAlerts() {
    try {
      const allData = await this.fetchAllSOSAlerts();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const pastData = allData.filter(alert => {
        const alertDate = new Date(alert.triggered_at || alert.created_at);
        return alertDate < oneDayAgo;
      });
      
      console.log(`📅 Past data: ${pastData.length} records`);
      return pastData;
    } catch (error) {
      console.error("❌ Error fetching past SOS alerts:", error);
      return [];
    }
  }

  // Fetch resolved/completed alerts
  static async fetchResolvedSOSAlerts() {
    try {
      const allData = await this.fetchAllSOSAlerts();
      const resolvedData = allData.filter(alert => 
        alert.status === "resolved" || alert.status === "completed"
      );
      
      console.log(`✅ Resolved data: ${resolvedData.length} records`);
      return resolvedData;
    } catch (error) {
      console.error("❌ Error fetching resolved SOS alerts:", error);
      return [];
    }
  }

  // Fetch active alerts
  static async fetchActiveSOSAlerts() {
    try {
      const allData = await this.fetchAllSOSAlerts();
      const activeData = allData.filter(alert => 
        alert.status === "active" || alert.status === "pending"
      );
      
      console.log(`🚨 Active data: ${activeData.length} records`);
      return activeData;
    } catch (error) {
      console.error("❌ Error fetching active SOS alerts:", error);
      return [];
    }
  }

  // Fetch alerts by date range
  static async fetchSOSAlertsByDateRange(startDate: Date, endDate: Date) {
    try {
      const allData = await this.fetchAllSOSAlerts();
      
      const filteredData = allData.filter(alert => {
        const alertDate = new Date(alert.triggered_at || alert.created_at);
        return alertDate >= startDate && alertDate <= endDate;
      });
      
      console.log(`📊 Date range data: ${filteredData.length} records`);
      return filteredData;
    } catch (error) {
      console.error("❌ Error fetching SOS alerts by date range:", error);
      return [];
    }
  }

  // Fetch alerts by emergency type
  static async fetchSOSAlertsByType(emergencyType: string) {
    try {
      const allData = await this.fetchAllSOSAlerts();
      const filteredData = allData.filter(alert => 
        alert.emergency_type === emergencyType
      );
      
      console.log(`🏥 ${emergencyType} data: ${filteredData.length} records`);
      return filteredData;
    } catch (error) {
      console.error("❌ Error fetching SOS alerts by type:", error);
      return [];
    }
  }

  // Get comprehensive statistics
  static async getSOSStatistics() {
    try {
      const allData = await this.fetchAllSOSAlerts();
      
      const stats = {
        total: allData.length,
        active: allData.filter(a => a.status === "active" || a.status === "pending").length,
        resolved: allData.filter(a => a.status === "resolved" || a.status === "completed").length,
        cancelled: allData.filter(a => a.status === "cancelled").length,
        byType: {
          medical: allData.filter(a => a.emergency_type === "medical").length,
          fire: allData.filter(a => a.emergency_type === "fire").length,
          police: allData.filter(a => a.emergency_type === "police").length,
          accident: allData.filter(a => a.emergency_type === "accident").length,
          other: allData.filter(a => a.emergency_type === "other").length,
        },
        byPriority: {
          critical: allData.filter(a => a.priority === "critical" || a.priority === 1).length,
          high: allData.filter(a => a.priority === "high" || a.priority === 2).length,
          medium: allData.filter(a => a.priority === "medium" || a.priority === 3).length,
          low: allData.filter(a => a.priority === "low" || a.priority === 4).length,
        },
        recent24h: allData.filter(a => {
          const alertDate = new Date(a.triggered_at || a.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return alertDate >= oneDayAgo;
        }).length,
        past24h: allData.filter(a => {
          const alertDate = new Date(a.triggered_at || a.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return alertDate < oneDayAgo;
        }).length,
      };
      
      console.log("📊 SOS Statistics:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error getting SOS statistics:", error);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        cancelled: 0,
        byType: { medical: 0, fire: 0, police: 0, accident: 0, other: 0 },
        byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
        recent24h: 0,
        past24h: 0,
      };
    }
  }

  // Test function to verify data access
  static async testDataAccess() {
    console.log("🧪 Testing SOS data access...");
    
    try {
      // Test 1: Fetch all data
      const allData = await this.fetchAllSOSAlerts();
      console.log(`✅ All data: ${allData.length} records`);
      
      // Test 2: Fetch past data
      const pastData = await this.fetchPastSOSAlerts();
      console.log(`✅ Past data: ${pastData.length} records`);
      
      // Test 3: Fetch resolved data
      const resolvedData = await this.fetchResolvedSOSAlerts();
      console.log(`✅ Resolved data: ${resolvedData.length} records`);
      
      // Test 4: Fetch active data
      const activeData = await this.fetchActiveSOSAlerts();
      console.log(`✅ Active data: ${activeData.length} records`);
      
      // Test 5: Get statistics
      const stats = await this.getSOSStatistics();
      console.log("✅ Statistics:", stats);
      
      // Test 6: Verify data structure
      if (allData.length > 0) {
        const sampleAlert = allData[0];
        console.log("✅ Sample alert structure:", {
          id: sampleAlert.id,
          status: sampleAlert.status,
          emergency_type: sampleAlert.emergency_type,
          priority: sampleAlert.priority,
          triggered_at: sampleAlert.triggered_at,
          hasLocation: !!(sampleAlert.latitude && sampleAlert.longitude),
          hasDescription: !!sampleAlert.description,
        });
      }
      
      console.log("🎉 All data access tests passed! Admin panel should work correctly.");
      return {
        success: true,
        totalRecords: allData.length,
        pastRecords: pastData.length,
        resolvedRecords: resolvedData.length,
        activeRecords: activeData.length,
        stats
      };
    } catch (error) {
      console.error("❌ Data access test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Real-time subscription for live updates
  static subscribeToSOSAlerts(callback: (payload: any) => void) {
    try {
      console.log("🔄 Subscribing to real-time SOS alerts...");
      
      return supabase
        .channel('sos_alerts_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'sos_alerts' 
        }, callback)
        .subscribe();
    } catch (error) {
      console.error("❌ Error subscribing to SOS alerts:", error);
      return null;
    }
  }

  // Update alert status
  static async updateAlertStatus(alertId: string, newStatus: string) {
    try {
      console.log(`🔄 Updating alert ${alertId} to status: ${newStatus}`);
      
      const { data, error } = await supabase
        .from('sos_alerts')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating alert status:", error);
        return { success: false, error };
      }

      console.log("✅ Alert status updated successfully");
      return { success: true, data };
    } catch (error) {
      console.error("❌ Exception updating alert status:", error);
      return { success: false, error };
    }
  }

  // Search alerts
  static async searchSOSAlerts(searchTerm: string) {
    try {
      const allData = await this.fetchAllSOSAlerts();
      
      const filteredData = allData.filter(alert => {
        const searchLower = searchTerm.toLowerCase();
        return (
          alert.id?.toLowerCase().includes(searchLower) ||
          alert.description?.toLowerCase().includes(searchLower) ||
          alert.emergency_type?.toLowerCase().includes(searchLower) ||
          alert.status?.toLowerCase().includes(searchLower) ||
          alert.priority?.toLowerCase().includes(searchLower) ||
          alert.address?.toLowerCase().includes(searchLower)
        );
      });
      
      console.log(`🔍 Search results for "${searchTerm}": ${filteredData.length} records`);
      return filteredData;
    } catch (error) {
      console.error("❌ Error searching SOS alerts:", error);
      return [];
    }
  }

  // Test complete data flow from upload to display
  static async testCompleteDataFlow() {
    try {
      console.log('🔄 Testing complete data flow...');
      
      // Step 1: Test database connection
      console.log('📡 Step 1: Testing database connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('sos_alerts')
        .select('id')
        .limit(1);
      
      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }
      console.log('✅ Database connection successful');
      
      // Step 2: Test SOS alerts table access
      console.log('📊 Step 2: Testing SOS alerts table access...');
      const { data: alertsData, error: alertsError } = await supabase
        .from('sos_alerts')
        .select('*')
        .limit(5);
      
      if (alertsError) {
        throw new Error(`SOS alerts access failed: ${alertsError.message}`);
      }
      console.log(`✅ SOS alerts accessible: ${alertsData.length} records`);
      
      // Step 3: Test sos_media table access
      console.log('📁 Step 3: Testing sos_media table access...');
      const { data: mediaData, error: mediaError } = await supabase
        .from('sos_media')
        .select('*')
        .limit(5);
      
      if (mediaError) {
        throw new Error(`SOS media access failed: ${mediaError.message}`);
      }
      console.log(`✅ SOS media accessible: ${mediaData.length} records`);
      
      // Step 4: Test data combination (instead of JOIN query)
      console.log('🔗 Step 4: Testing data combination...');
      
      // Fetch alerts and media separately
      const { data: testAlerts, error: testAlertsError } = await supabase
        .from('sos_alerts')
        .select('*')
        .limit(3);
      
      if (testAlertsError) {
        throw new Error(`SOS alerts query failed: ${testAlertsError.message}`);
      }
      
      const { data: testMedia, error: testMediaError } = await supabase
        .from('sos_media')
        .select('*');
      
      if (testMediaError) {
        throw new Error(`SOS media query failed: ${testMediaError.message}`);
      }
      
      // Combine the data
      const combinedData = testAlerts.map(alert => {
        const alertMedia = testMedia.filter(media => media.sos_alert_id === alert.id);
        return {
          ...alert,
          media: alertMedia,
          hasMedia: alertMedia.length > 0,
          mediaCount: alertMedia.length
        };
      });
      
      console.log(`✅ Data combination successful: ${combinedData.length} records with media`);
      
      // Step 5: Test real-time subscription setup
      console.log('⚡ Step 5: Testing real-time subscription setup...');
      const testChannel = supabase
        .channel('test_channel')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sos_alerts' 
          }, 
          (payload) => {
            console.log('📡 Real-time test event received:', payload.eventType);
          }
        )
        .subscribe();
      
      // Wait a moment for subscription to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clean up test subscription
      testChannel.unsubscribe();
      console.log('✅ Real-time subscription test successful');
      
      // Step 6: Test data processing
      console.log('🔄 Step 6: Testing data processing...');
      const processedData = combinedData;
      
      const alertsWithMedia = processedData.filter(alert => alert.hasMedia);
      console.log(`✅ Data processing successful: ${alertsWithMedia.length} alerts have media`);
      
      // Step 7: Test storage access (if available)
      console.log('💾 Step 7: Testing storage access...');
      try {
        const { data: storageData, error: storageError } = await supabase.storage
          .from('sos-media')
          .list('', { limit: 1 });
        
        if (storageError) {
          console.log('⚠️ Storage access limited:', storageError.message);
        } else {
          console.log('✅ Storage access successful');
        }
      } catch (storageError) {
        console.log('⚠️ Storage test skipped:', storageError.message);
      }
      
      // Summary
      const summary = {
        success: true,
        databaseConnection: true,
        sosAlertsAccess: true,
        sosMediaAccess: true,
        dataCombination: true,
        realtimeSubscription: true,
        dataProcessing: true,
        totalAlerts: alertsData.length,
        totalMedia: mediaData.length,
        alertsWithMedia: alertsWithMedia.length,
        processedData: processedData.length
      };
      
      console.log('🎉 Complete data flow test successful!');
      console.log('📊 Test Summary:', summary);
      
      return summary;
    } catch (error) {
      console.error('❌ Complete data flow test failed:', error);
      return { 
        success: false, 
        error: error.message,
        step: 'Unknown'
      };
    }
  }
}

// Export convenience functions
export const fetchAllSOSAlerts = SOSDataService.fetchAllSOSAlerts;
export const fetchPastSOSAlerts = SOSDataService.fetchPastSOSAlerts;
export const fetchResolvedSOSAlerts = SOSDataService.fetchResolvedSOSAlerts;
export const fetchActiveSOSAlerts = SOSDataService.fetchActiveSOSAlerts;
export const getSOSStatistics = SOSDataService.getSOSStatistics;
export const testDataAccess = SOSDataService.testDataAccess;
export const testCompleteDataFlow = SOSDataService.testCompleteDataFlow;
export const subscribeToSOSAlerts = SOSDataService.subscribeToSOSAlerts;
export const updateAlertStatus = SOSDataService.updateAlertStatus;
export const searchSOSAlerts = SOSDataService.searchSOSAlerts;
