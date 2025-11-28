/**
 * Supabase Configuration Test
 * This file helps debug Supabase connection issues
 */

import { supabase } from '../supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Check Supabase client configuration
    console.log('📋 Supabase Client Info:', {
      url: supabase.supabaseUrl,
      hasAnonKey: !!supabase.supabaseKey,
      anonKeyLength: supabase.supabaseKey?.length || 0,
      anonKeyPreview: supabase.supabaseKey?.substring(0, 20) + '...' || 'No key'
    });
    
    // Test 2: Try to get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Session Info:', {
      hasSession: !!sessionData.session,
      hasUser: !!sessionData.session?.user,
      sessionError: sessionError?.message || 'No error'
    });
    
    // Test 3: Test database connection
    const { data: dbData, error: dbError } = await supabase
      .from('sos_alerts')
      .select('count')
      .limit(1);
    
    console.log('🗄️ Database Connection:', {
      success: !dbError,
      error: dbError?.message || 'No error',
      hasData: !!dbData
    });
    
    // Test 4: Test Edge Function endpoint directly
    console.log('🌐 Testing Edge Function endpoints...');
    
    const endpoints = [
      'https://example.com/api/health',
      'https://example.com/api/status',
      'https://example.com/api/metadata'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          signal: AbortSignal.timeout(5000)
        });
        
        console.log(`📡 ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
      } catch (error) {
        console.error(`💥 ${endpoint}:`, error);
      }
    }
    
    return {
      success: true,
      supabaseConfigured: !!supabase.supabaseKey,
      hasSession: !!sessionData.session,
      databaseConnected: !dbError
    };
    
  } catch (error) {
    console.error('💥 Supabase test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
