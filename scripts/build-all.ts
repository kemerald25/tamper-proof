#!/usr/bin/env ts-node

/**
 * Build All Components Script
 * 
 * Builds all components (contracts, backend, frontend) for production.
 * 
 * Usage:
 *   ts-node scripts/build-all.ts
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('🏗️  Building All Components');
console.log('============================\n');

// Build contracts
console.log('📝 Compiling contracts...');
try {
  execSync('npm run compile', {
    cwd: path.join(__dirname, '../contracts'),
    stdio: 'inherit',
  });
  console.log('✅ Contracts compiled successfully\n');
} catch (error) {
  console.error('❌ Contract compilation failed');
  process.exit(1);
}

// Build backend
console.log('🔧 Building backend...');
try {
  execSync('npm run build', {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'inherit',
  });
  console.log('✅ Backend built successfully\n');
} catch (error) {
  console.error('❌ Backend build failed');
  process.exit(1);
}

// Build frontend
console.log('⚛️  Building frontend...');
try {
  execSync('npm run build', {
    cwd: path.join(__dirname, '../frontend'),
    stdio: 'inherit',
  });
  console.log('✅ Frontend built successfully\n');
} catch (error) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}

console.log('✅ All components built successfully!');

