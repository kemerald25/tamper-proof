#!/usr/bin/env ts-node

/**
 * Environment Variables Checker
 * 
 * Checks if all required environment variables are set.
 * 
 * Usage:
 *   ts-node scripts/check-env.ts <component>
 * 
 * Components: backend | frontend | contracts | all
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

interface EnvCheck {
  name: string;
  required: boolean;
  found: boolean;
  value?: string;
}

function checkEnvFile(envPath: string, envExamplePath: string): EnvCheck[] {
  const checks: EnvCheck[] = [];

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found at:', envPath);
    console.log('   Please create a .env file or copy from .env.example');
    return checks;
  }

  if (!fs.existsSync(envExamplePath)) {
    console.log('⚠️  .env.example file not found at:', envExamplePath);
    console.log('   Skipping environment variable check for this component');
    return checks;
  }

  const env = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
  const example = fs.readFileSync(envExamplePath, 'utf-8');

  // Extract variable names from .env.example
  const variableRegex = /^([A-Z_][A-Z0-9_]*)=/gm;
  const requiredVars: string[] = [];
  let match;

  while ((match = variableRegex.exec(example)) !== null) {
    requiredVars.push(match[1]);
  }

  requiredVars.forEach((varName) => {
    const found = varName in env;
    const value = env[varName];
    checks.push({
      name: varName,
      required: true,
      found,
      value: found && value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : undefined,
    });
  });

  return checks;
}

function checkComponent(component: string): void {
  console.log(`\n🔍 Checking ${component} environment variables...`);
  console.log('='.repeat(50));

  let envPath: string;
  let envExamplePath: string;

  switch (component) {
    case 'backend':
      envPath = path.join(__dirname, '../backend/.env');
      envExamplePath = path.join(__dirname, '../backend/.env.example');
      break;
    case 'frontend':
      envPath = path.join(__dirname, '../frontend/.env');
      envExamplePath = path.join(__dirname, '../frontend/.env.example');
      break;
    case 'contracts':
      envPath = path.join(__dirname, '../contracts/.env');
      envExamplePath = path.join(__dirname, '../contracts/.env.example');
      break;
    default:
      console.error('❌ Invalid component. Must be: backend, frontend, contracts, or all');
      return;
  }

  const checks = checkEnvFile(envPath, envExamplePath);

  if (checks.length === 0) {
    console.log('⚠️  No environment variables found to check');
    return;
  }

  let allGood = true;
  checks.forEach((check) => {
    if (check.found) {
      console.log(`✅ ${check.name}: ${check.value || 'set'}`);
    } else {
      console.log(`❌ ${check.name}: MISSING`);
      allGood = false;
    }
  });

  if (allGood) {
    console.log('\n✅ All environment variables are set!');
  } else {
    console.log('\n⚠️  Some environment variables are missing. Please check your .env file.');
  }
}

const component = process.argv[2] || 'all';

if (component === 'all') {
  checkComponent('backend');
  checkComponent('frontend');
  checkComponent('contracts');
} else {
  checkComponent(component);
}

