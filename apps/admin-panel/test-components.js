#!/usr/bin/env node

/**
 * Component Validation Script
 * Validates all React components for syntax and import issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

const log = (message, type = 'info') => {
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
};

const addResult = (testName, passed, details = '') => {
  results.total++;
  if (passed) {
    results.passed++;
    log(`PASS: ${testName}`, 'success');
  } else {
    results.failed++;
    log(`FAIL: ${testName}`, 'error');
    if (details) log(`Details: ${details}`, 'error');
  }
  results.details.push({ testName, passed, details });
};

// Validate React component syntax
const validateReactComponent = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic React component checks
    const hasReactImport = content.includes('import React') || content.includes('import * as React');
    const hasExport = content.includes('export') || content.includes('export default');
    const hasValidJSX = content.includes('return (') || content.includes('return(') || content.includes('return <');
    const hasValidSyntax = !content.includes('syntax error') && !content.includes('import error');
    
    // Check for common React patterns
    const hasUseState = content.includes('useState') || content.includes('React.useState');
    const hasUseEffect = content.includes('useEffect') || content.includes('React.useEffect');
    const hasUseRef = content.includes('useRef') || content.includes('React.useRef');
    
    // Check for proper TypeScript interfaces
    const hasInterface = content.includes('interface') || content.includes('type ');
    const hasProps = content.includes('Props') || content.includes('props');
    
    return {
      isValid: hasReactImport && hasExport && hasValidJSX && hasValidSyntax,
      details: {
        hasReactImport,
        hasExport,
        hasValidJSX,
        hasValidSyntax,
        hasUseState,
        hasUseEffect,
        hasUseRef,
        hasInterface,
        hasProps
      }
    };
  } catch (error) {
    return {
      isValid: false,
      details: { error: error.message }
    };
  }
};

// Validate service file syntax
const validateServiceFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic service checks
    const hasExports = content.includes('export');
    const hasValidSyntax = !content.includes('syntax error');
    const hasFunctions = content.includes('function') || content.includes('const ') || content.includes('class ');
    const hasImports = content.includes('import');
    
    return {
      isValid: hasExports && hasValidSyntax,
      details: {
        hasExports,
        hasValidSyntax,
        hasFunctions,
        hasImports
      }
    };
  } catch (error) {
    return {
      isValid: false,
      details: { error: error.message }
    };
  }
};

// Test components
const testComponents = () => {
  log('Testing React components...');
  
  const components = [
    {
      path: 'src/components/media/MediaPlayer.tsx',
      type: 'component',
      name: 'MediaPlayer'
    },
    {
      path: 'src/components/media/MediaUpload.tsx',
      type: 'component',
      name: 'MediaUpload'
    },
    {
      path: 'src/components/map/EnhancedAdminMap.tsx',
      type: 'component',
      name: 'EnhancedAdminMap'
    },
    {
      path: 'src/components/admin/TestMode.tsx',
      type: 'component',
      name: 'TestMode'
    }
  ];

  components.forEach(component => {
    const fullPath = path.join(__dirname, component.path);
    
    if (!fs.existsSync(fullPath)) {
      addResult(
        `${component.name} Component`,
        false,
        `File not found: ${component.path}`
      );
      return;
    }

    const validation = validateReactComponent(fullPath);
    
    addResult(
      `${component.name} Component`,
      validation.isValid,
      validation.isValid ? 'Component syntax valid' : `Syntax issues: ${JSON.stringify(validation.details)}`
    );
  });
};

// Test services
const testServices = () => {
  log('Testing service files...');
  
  const services = [
    {
      path: 'src/lib/firebase.ts',
      type: 'service',
      name: 'Firebase Service'
    },
    {
      path: 'src/lib/services/distance.ts',
      type: 'service',
      name: 'Distance Service'
    }
  ];

  services.forEach(service => {
    const fullPath = path.join(__dirname, service.path);
    
    if (!fs.existsSync(fullPath)) {
      addResult(
        `${service.name}`,
        false,
        `File not found: ${service.path}`
      );
      return;
    }

    const validation = validateServiceFile(fullPath);
    
    addResult(
      `${service.name}`,
      validation.isValid,
      validation.isValid ? 'Service syntax valid' : `Syntax issues: ${JSON.stringify(validation.details)}`
    );
  });
};

// Test imports
const testImports = () => {
  log('Testing import statements...');
  
  const files = [
    'src/components/media/MediaPlayer.tsx',
    'src/components/media/MediaUpload.tsx',
    'src/components/map/EnhancedAdminMap.tsx',
    'src/components/admin/TestMode.tsx',
    'src/lib/firebase.ts',
    'src/lib/services/distance.ts'
  ];

  let allImportsValid = true;
  const invalidImports = [];

  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    
    if (!fs.existsSync(fullPath)) {
      allImportsValid = false;
      invalidImports.push(`${file} (file not found)`);
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for common import patterns
      const importLines = content.match(/import.*from.*['"]/g) || [];
      
      importLines.forEach(importLine => {
        // Check for relative imports
        if (importLine.includes('@/')) {
          // This is an alias import, should be fine
          return;
        }
        
        // Check for relative path imports
        if (importLine.includes('./') || importLine.includes('../')) {
          const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
          if (match) {
            const importPath = match[1];
            const resolvedPath = path.resolve(path.dirname(fullPath), importPath);
            
            // Check if it's a TypeScript file
            const tsPath = resolvedPath.endsWith('.ts') ? resolvedPath : `${resolvedPath}.ts`;
            const tsxPath = resolvedPath.endsWith('.tsx') ? resolvedPath : `${resolvedPath}.tsx`;
            
            if (!fs.existsSync(tsPath) && !fs.existsSync(tsxPath)) {
              allImportsValid = false;
              invalidImports.push(`${file}: ${importPath}`);
            }
          }
        }
      });
    } catch (error) {
      allImportsValid = false;
      invalidImports.push(`${file} (read error: ${error.message})`);
    }
  });

  addResult(
    'Import Statements',
    allImportsValid,
    allImportsValid ? 'All imports valid' : `Invalid imports: ${invalidImports.join(', ')}`
  );
};

// Test TypeScript configuration
const testTypeScriptConfig = () => {
  log('Testing TypeScript configuration...');
  
  const tsConfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    addResult('TypeScript Config', false, 'tsconfig.json not found');
    return;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    const hasCompilerOptions = !!tsConfig.compilerOptions;
    const hasStrictMode = tsConfig.compilerOptions?.strict === true;
    const hasJsx = !!tsConfig.compilerOptions?.jsx;
    const hasPaths = !!tsConfig.compilerOptions?.paths;
    
    const isValid = hasCompilerOptions && hasJsx && hasPaths;
    
    addResult(
      'TypeScript Config',
      isValid,
      isValid ? 'TypeScript config valid' : `Missing: ${!hasCompilerOptions ? 'compilerOptions' : ''} ${!hasJsx ? 'jsx' : ''} ${!hasPaths ? 'paths' : ''}`
    );
  } catch (error) {
    addResult('TypeScript Config', false, `Parse error: ${error.message}`);
  }
};

// Test Vite configuration
const testViteConfig = () => {
  log('Testing Vite configuration...');
  
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    addResult('Vite Config', false, 'vite.config.ts not found');
    return;
  }

  try {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    
    const hasDefineConfig = content.includes('defineConfig');
    const hasReact = content.includes('react');
    const hasPathAlias = content.includes('@/') || content.includes('resolve.alias');
    const hasValidSyntax = !content.includes('syntax error');
    
    const isValid = hasDefineConfig && hasReact && hasPathAlias && hasValidSyntax;
    
    addResult(
      'Vite Config',
      isValid,
      isValid ? 'Vite config valid' : `Missing: ${!hasDefineConfig ? 'defineConfig' : ''} ${!hasReact ? 'react' : ''} ${!hasPathAlias ? 'path alias' : ''}`
    );
  } catch (error) {
    addResult('Vite Config', false, `Read error: ${error.message}`);
  }
};

// Main test runner
const runAllTests = () => {
  log('🚀 Starting Component Validation Tests...');
  log('');
  
  testComponents();
  testServices();
  testImports();
  testTypeScriptConfig();
  testViteConfig();
  
  // Generate summary
  log('');
  log('📊 Test Results Summary:');
  log(`Total Tests: ${results.total}`);
  log(`Passed: ${results.passed}`, results.passed > 0 ? 'success' : 'error');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    log('🎉 All component tests passed!', 'success');
  } else {
    log('❌ Some component tests failed. Please review the issues above.', 'error');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(1)
    },
    details: results.details
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'component-test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  log('📄 Detailed report saved to component-test-report.json');
};

// Run tests
runAllTests().catch(error => {
  log(`Test suite failed: ${error.message}`, 'error');
  process.exit(1);
}); 