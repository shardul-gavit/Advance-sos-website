import { supabase } from '../supabase';

/**
 * Database Diagnostics Service
 * Helps verify table structure and diagnose data access issues
 */
export class DatabaseDiagnostics {
  /**
   * Check which tables exist in the database
   */
  static async checkTableExistence() {
    try {
      console.log('🔍 Checking table existence...');
      
      const tablesToCheck = [
        'sos_alerts',
        'sos_media',
        'users',
        'emergency_contacts',
        'emergency_services',
        'responder_location_history'
      ];

      const results: Record<string, boolean> = {};

      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

          if (error) {
            // Check if it's a "relation does not exist" error
            if (error.message?.includes('does not exist') || error.code === '42P01') {
              results[table] = false;
            } else {
              // Table exists but might have permission issues
              results[table] = true;
              console.warn(`⚠️ Table ${table} exists but has access issues:`, error.message);
            }
          } else {
            results[table] = true;
          }
        } catch (err) {
          results[table] = false;
        }
      }

      console.log('📊 Table existence check results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error checking table existence:', error);
      return {};
    }
  }

  /**
   * Check the structure of sos_alerts table
   */
  static async checkSOSAlertsStructure() {
    try {
      console.log('🔍 Checking sos_alerts table structure...');
      
      // Try to fetch one record to see what columns are available
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Error fetching sos_alerts:', error);
        return { error: error.message, columns: [] };
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('✅ sos_alerts columns:', columns);
        console.log('📋 Sample record:', data[0]);
        return { error: null, columns, sampleRecord: data[0] };
      } else {
        console.warn('⚠️ sos_alerts table is empty');
        return { error: null, columns: [], sampleRecord: null };
      }
    } catch (error) {
      console.error('❌ Error checking sos_alerts structure:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', columns: [] };
    }
  }

  /**
   * Count records in sos_alerts table
   */
  static async countSOSAlerts() {
    try {
      console.log('🔍 Counting sos_alerts records...');
      
      // Try different methods to count
      const { data, error, count } = await supabase
        .from('sos_alerts')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Error counting sos_alerts:', error);
        return { count: 0, error: error.message };
      }

      console.log(`📊 Total sos_alerts count: ${count || 0}`);
      return { count: count || 0, error: null };
    } catch (error) {
      console.error('❌ Error counting sos_alerts:', error);
      return { count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test fetching sos_alerts with different column names
   */
  static async testSOSAlertsFetch() {
    try {
      console.log('🔍 Testing sos_alerts fetch with different approaches...');
      
      const results: any = {};

      // Test 1: Fetch all columns
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .limit(5);
        
        results.allColumns = {
          success: !error,
          count: data?.length || 0,
          error: error?.message,
          sample: data?.[0]
        };
      } catch (err) {
        results.allColumns = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 2: Fetch with specific columns
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('id, user_id, emergency_type, status, created_at, triggered_at, latitude, longitude')
          .limit(5);
        
        results.specificColumns = {
          success: !error,
          count: data?.length || 0,
          error: error?.message,
          sample: data?.[0]
        };
      } catch (err) {
        results.specificColumns = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 3: Order by created_at
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        results.orderByCreatedAt = {
          success: !error,
          count: data?.length || 0,
          error: error?.message
        };
      } catch (err) {
        results.orderByCreatedAt = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 4: Order by triggered_at (if it exists)
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(5);
        
        results.orderByTriggeredAt = {
          success: !error,
          count: data?.length || 0,
          error: error?.message
        };
      } catch (err) {
        results.orderByTriggeredAt = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      console.log('📊 Fetch test results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error testing sos_alerts fetch:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Run full diagnostics
   */
  static async runFullDiagnostics() {
    console.log('🚀 Running full database diagnostics...');
    
    const diagnostics = {
      tableExistence: await this.checkTableExistence(),
      sosAlertsStructure: await this.checkSOSAlertsStructure(),
      sosAlertsCount: await this.countSOSAlerts(),
      fetchTests: await this.testSOSAlertsFetch()
    };

    console.log('📊 Full diagnostics results:', diagnostics);
    return diagnostics;
  }
}

