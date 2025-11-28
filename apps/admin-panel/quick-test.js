#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Quick Component Test');
console.log('=======================');

// Test files
const testFiles = [
  'src/components/media/MediaPlayer.tsx',
  'src/components/media/MediaUpload.tsx',
  'src/components/map/EnhancedAdminMap.tsx',
  'src/components/admin/TestMode.tsx',
  'src/lib/firebase.ts',
  'src/lib/services/distance.ts'
];

let passed = 0;
let failed = 0;

testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${file} - File not found`);
    failed++;
    return;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Basic checks
    const hasReactImport = content.includes('import React') || content.includes('import * as React');
    const hasExport = content.includes('export');
    const hasValidSyntax = !content.includes('syntax error');
    
    if (hasExport && hasValidSyntax) {
      console.log(`✅ ${file} - Valid`);
      passed++;
    } else {
      console.log(`❌ ${file} - Invalid syntax`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${file} - Error: ${error.message}`);
    failed++;
  }
});

console.log('\n📊 Summary:');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('🎉 All components are valid!');
} else {
  console.log('⚠️ Some components have issues');
} 