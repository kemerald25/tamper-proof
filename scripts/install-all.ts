#!/usr/bin/env ts-node

/**
 * Install All Dependencies Script
 * 
 * Installs all npm dependencies for contracts, backend, and frontend.
 * 
 * Usage:
 *   ts-node scripts/install-all.ts
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('📦 Installing All Dependencies');
console.log('==============================\n');

const directories = [
  { name: 'Contracts', path: path.join(__dirname, '../contracts') },
  { name: 'Backend', path: path.join(__dirname, '../backend') },
  { name: 'Frontend', path: path.join(__dirname, '../frontend') },
];

directories.forEach((dir) => {
  console.log(`📦 Installing ${dir.name} dependencies...`);
  try {
    execSync('npm install', {
      cwd: dir.path,
      stdio: 'inherit',
    });
    console.log(`✅ ${dir.name} dependencies installed successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to install ${dir.name} dependencies`);
    console.error(error);
    process.exit(1);
  }
});

console.log('✅ All dependencies installed successfully!');

