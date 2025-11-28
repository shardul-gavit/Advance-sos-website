import fs from 'fs';
import path from 'path';

console.log('🧪 Advance SOS System - Admin Panel Test');
console.log('==========================================');

// Test 1: File Structure
console.log('\n1. Testing File Structure...');

const requiredFiles = [
  'src/pages/admin/dashboard.tsx',
  'src/lib/supabase.ts',
  'src/lib/services/api.ts',
  'supabase_schema.sql'
];

let fileTestsPassed = 0;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTS`);
    fileTestsPassed++;
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

console.log(`File Structure: ${fileTestsPassed}/${requiredFiles.length} passed`);

// Test 2: Package.json
console.log('\n2. Testing Package Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['@supabase/supabase-js', 'mapbox-gl', 'react'];
  let depsPassed = 0;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - INSTALLED`);
      depsPassed++;
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
  
  console.log(`Dependencies: ${depsPassed}/${requiredDeps.length} passed`);
} catch (error) {
  console.log('❌ package.json not found or invalid');
}

// Test 3: Environment Variables
console.log('\n3. Testing Environment Variables...');
const envFile = '.env';
if (fs.existsSync(envFile)) {
  console.log('✅ .env file exists');
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_MAPBOX_TOKEN'];
  let envPassed = 0;
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`✅ ${varName} - FOUND`);
      envPassed++;
    } else {
      console.log(`❌ ${varName} - MISSING`);
    }
  });
  
  console.log(`Environment Variables: ${envPassed}/${requiredVars.length} passed`);
} else {
  console.log('❌ .env file not found');
}

// Test 4: Database Schema
console.log('\n4. Testing Database Schema...');
const schemaFile = 'supabase_schema.sql';
if (fs.existsSync(schemaFile)) {
  console.log('✅ supabase_schema.sql exists');
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  const requiredTables = ['users', 'sos_events', 'helpers', 'responders', 'hospitals', 'media'];
  let tablesFound = 0;
  
  requiredTables.forEach(table => {
    if (schemaContent.includes(`CREATE TABLE public.${table}`)) {
      console.log(`✅ Table ${table} - DEFINED`);
      tablesFound++;
    } else {
      console.log(`❌ Table ${table} - MISSING`);
    }
  });
  
  console.log(`Database Tables: ${tablesFound}/${requiredTables.length} defined`);
} else {
  console.log('❌ supabase_schema.sql not found');
}

// Test 5: React Components
console.log('\n5. Testing React Components...');
const componentFiles = [
  'src/components/admin/AdminDashboard.tsx',
  'src/components/map/EnhancedAdminMap.tsx',
  'src/components/auth/LoginForm.tsx'
];

let componentsFound = 0;
componentFiles.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component} - EXISTS`);
    componentsFound++;
  } else {
    console.log(`❌ ${component} - MISSING`);
  }
});

console.log(`React Components: ${componentsFound}/${componentFiles.length} found`);

console.log('\n==========================================');
console.log('🎯 Test Summary: Basic file structure and configuration verified');
console.log('Next steps: Run the development server and test live functionality'); 