const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Admin Panel Features...\n');

// Test results
let passed = 0;
let failed = 0;
let total = 0;

const test = (name, condition, details = '') => {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    failed++;
    console.log(`❌ ${name} - ${details}`);
  }
};

// Check key files
console.log('📁 File Structure:');
test('Location Service', fs.existsSync('src/services/locationService.ts'), 'Location service missing');
test('Location Context', fs.existsSync('src/contexts/LocationContext.tsx'), 'Location context missing');
test('Admin Map Component', fs.existsSync('src/components/admin/LocationMap.tsx'), 'Admin map missing');
test('Location Status UI', fs.existsSync('src/components/ui/location-status.tsx'), 'Location status UI missing');
test('Location Performance UI', fs.existsSync('src/components/ui/location-performance.tsx'), 'Location performance UI missing');

// Check package.json
console.log('\n📦 Dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  
  test('React Map GL', deps['react-map-gl'] || devDeps['react-map-gl'], 'react-map-gl missing');
  test('Mapbox GL', deps['mapbox-gl'] || devDeps['mapbox-gl'], 'mapbox-gl missing');
  test('Supabase Client', deps['@supabase/supabase-js'], '@supabase/supabase-js missing');
  test('Framer Motion', deps['framer-motion'], 'framer-motion missing');
  test('Lucide React', deps['lucide-react'], 'lucide-react missing');
} catch (error) {
  test('Package.json', false, 'Cannot read package.json');
}

// Check configuration files
console.log('\n⚙️ Configuration:');
test('Vite Config', fs.existsSync('vite.config.ts'), 'Vite config missing');
test('TypeScript Config', fs.existsSync('tsconfig.json'), 'TypeScript config missing');
test('Tailwind Config', fs.existsSync('tailwind.config.ts'), 'Tailwind config missing');
test('Environment Example', fs.existsSync('env.example'), 'Environment example missing');

// Check main application files
console.log('\n🚀 Application Files:');
test('Main Entry Point', fs.existsSync('src/main.tsx'), 'Main entry point missing');
test('App Component', fs.existsSync('src/App.tsx'), 'App component missing');
test('Index Page', fs.existsSync('src/pages/Index.tsx'), 'Index page missing');
test('HTML Template', fs.existsSync('index.html'), 'HTML template missing');

// Check location service content
console.log('\n📍 Location Features:');
if (fs.existsSync('src/services/locationService.ts')) {
  const locationContent = fs.readFileSync('src/services/locationService.ts', 'utf8');
  test('getCurrentLocation Function', locationContent.includes('getCurrentLocation'), 'getCurrentLocation function missing');
  test('getQuickLocation Function', locationContent.includes('getQuickLocation'), 'getQuickLocation function missing');
  test('Geolocation API', locationContent.includes('navigator.geolocation'), 'Geolocation API usage missing');
  test('Location Tracking', locationContent.includes('startLocationTracking'), 'Location tracking missing');
  test('Performance Optimizations', locationContent.includes('timeout: 8000') || locationContent.includes('timeout: 3000'), 'Performance optimizations missing');
}

// Check location context content
console.log('\n🔄 Location Context:');
if (fs.existsSync('src/contexts/LocationContext.tsx')) {
  const contextContent = fs.readFileSync('src/contexts/LocationContext.tsx', 'utf8');
  test('Location Provider', contextContent.includes('LocationProvider'), 'LocationProvider missing');
  test('useLocation Hook', contextContent.includes('useLocation'), 'useLocation hook missing');
  test('Permission Request', contextContent.includes('requestLocationPermission'), 'Permission request missing');
  test('Quick Location Usage', contextContent.includes('getQuickLocation'), 'Quick location usage missing');
}

// Check map components
console.log('\n🗺️ Map Features:');
if (fs.existsSync('src/components/admin/LocationMap.tsx')) {
  const mapContent = fs.readFileSync('src/components/admin/LocationMap.tsx', 'utf8');
  test('Mapbox Integration', mapContent.includes('mapbox'), 'Mapbox integration missing');
  test('React Map GL', mapContent.includes('react-map-gl'), 'React Map GL missing');
  test('Map Component', mapContent.includes('Map'), 'Map component missing');
  test('Navigation Control', mapContent.includes('NavigationControl'), 'Navigation control missing');
}

// Summary
console.log('\n📊 Summary:');
console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All features are working correctly!');
} else {
  console.log('\n⚠️ Some features need attention. Please check the failed tests above.');
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  summary: { total, passed, failed, successRate: `${((passed / total) * 100).toFixed(1)}%` },
  features: {
    location: {
      service: fs.existsSync('src/services/locationService.ts'),
      context: fs.existsSync('src/contexts/LocationContext.tsx'),
      quickLocation: fs.existsSync('src/services/locationService.ts') && 
                    fs.readFileSync('src/services/locationService.ts', 'utf8').includes('getQuickLocation')
    },
    maps: {
      adminMap: fs.existsSync('src/components/admin/LocationMap.tsx'),
      mapbox: fs.existsSync('src/components/admin/LocationMap.tsx') && 
              fs.readFileSync('src/components/admin/LocationMap.tsx', 'utf8').includes('mapbox')
    },
    ui: {
      locationStatus: fs.existsSync('src/components/ui/location-status.tsx'),
      locationPerformance: fs.existsSync('src/components/ui/location-performance.tsx')
    }
  }
};

fs.writeFileSync('feature-check-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Report saved to feature-check-report.json'); 