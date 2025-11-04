#!/usr/bin/env ts-node

/**
 * Database Setup Script
 * 
 * This script helps set up the Supabase database schema.
 * Run this after creating your Supabase project.
 * 
 * Usage:
 *   ts-node scripts/setup-database.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(__dirname, '../docs/database-schema.sql');

console.log('📊 Database Setup Script');
console.log('========================\n');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Error: database-schema.sql not found at:', schemaPath);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

console.log('✅ Database schema file found');
console.log('\n📋 Instructions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL schema:');
console.log('\n' + '='.repeat(50));
console.log(schema);
console.log('='.repeat(50));
console.log('\n✅ After running the SQL, your database will be ready!');
console.log('\n💡 Next steps:');
console.log('   - Update your .env files with Supabase credentials');
console.log('   - Run: ts-node scripts/create-admin.ts');

