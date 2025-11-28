import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, Globe, AlertTriangle } from 'lucide-react';
import { supabase, authService } from '@/lib/supabase';

const ConnectionTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runConnectionTests = async () => {
    setIsTesting(true);
    setResults([]);

    const tests = [
      {
        name: 'Environment Variables',
        test: async () => {
          const url = import.meta.env.VITE_SUPABASE_URL;
          const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
          return {
            success: !!(url && key),
            message: url && key ? 'Environment variables loaded' : 'Missing environment variables',
            details: { url: url ? '✓' : '✗', key: key ? '✓' : '✗' }
          };
        }
      },
      {
        name: 'Supabase Client Creation',
        test: async () => {
          try {
            const client = supabase;
            return {
              success: !!client,
              message: 'Supabase client created successfully',
              details: { client: client ? '✓' : '✗' }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Failed to create Supabase client',
              details: { error: error.message }
            };
          }
        }
      },
      {
        name: 'Network Connectivity',
        test: async () => {
          try {
            const response = await fetch('https://odkvcbnsimkhpmkllngo.supabase.co/rest/v1/', {
              method: 'GET',
              headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ka3ZjYm5zaW1raHBta2xsbmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNTI2MzIsImV4cCI6MjA2NzgyODYzMn0.xHYXF_zuh_YpASkEfd55AtV_hjoEnh0j8RRiNaVL29k'}`
              }
            });
            return {
              success: response.ok,
              message: response.ok ? 'Network connection successful' : `HTTP ${response.status}`,
              details: { status: response.status, statusText: response.statusText }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Network connection failed',
              details: { error: error.message }
            };
          }
        }
      },
      {
        name: 'Database Connection',
        test: async () => {
          try {
            const { data, error } = await supabase.from('responder_location_history').select('count').limit(1);
            return {
              success: !error,
              message: error ? 'Database connection failed' : 'Database connection successful',
              details: { error: error?.message || 'None' }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Database connection failed',
              details: { error: error.message }
            };
          }
        }
      },
      {
        name: 'Authentication Service',
        test: async () => {
          try {
            const { user, error } = await authService.getCurrentUser();
            return {
              success: !error,
              message: error ? 'Auth service failed' : 'Auth service working',
              details: { error: error?.message || 'None', user: user ? '✓' : 'None' }
            };
          } catch (error) {
            return {
              success: false,
              message: 'Auth service failed',
              details: { error: error.message }
            };
          }
        }
      },
      {
        name: 'CSP Check',
        test: async () => {
          const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
          const cspContent = cspMeta?.getAttribute('content') || '';
          const hasSupabase = cspContent.includes('supabase.co');
          return {
            success: hasSupabase,
            message: hasSupabase ? 'CSP allows Supabase' : 'CSP blocks Supabase',
            details: { cspPresent: !!cspMeta, allowsSupabase: hasSupabase }
          };
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        setResults(prev => [...prev, { name: test.name, ...result }]);
      } catch (error) {
        setResults(prev => [...prev, {
          name: test.name,
          success: false,
          message: 'Test failed with exception',
          details: { error: error.message }
        }]);
      }
    }

    setIsTesting(false);
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Connection Diagnostic Tool
          </CardTitle>
          <p className="text-gray-400 text-sm">
            This tool will help diagnose why login/signup is failing
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runConnectionTests} 
              disabled={isTesting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Run Diagnostics
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setResults([])}
              disabled={isTesting}
            >
              Clear Results
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white">Tests: {totalCount}</span>
                <span className="text-green-400">Passed: {successCount}</span>
                <span className="text-red-400">Failed: {totalCount - successCount}</span>
              </div>
              
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-white font-medium">{result.name}</p>
                      <p className={`text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                        {result.message}
                      </p>
                      {result.details && (
                        <div className="mt-2 text-xs text-gray-400">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded">
            <h4 className="text-blue-400 font-medium mb-2">Environment Variables:</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <p>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}</p>
              <p>VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '✓ Set' : '✗ Missing'}</p>
              <p>VITE_MAPBOX_TOKEN: {import.meta.env.VITE_MAPBOX_TOKEN ? '✓ Set' : '✗ Missing'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionTest; 