#!/usr/bin/env ts-node

/**
 * Data Migration Script
 * 
 * Utility script for migrating data between environments or backing up data.
 * 
 * Usage:
 *   ts-node scripts/migrate-data.ts backup
 *   ts-node scripts/migrate-data.ts restore <backup-file>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupData(): Promise<void> {
  try {
    console.log('📦 Creating data backup...');

    // Backup students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');

    if (studentsError) throw studentsError;

    // Backup results
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*');

    if (resultsError) throw resultsError;

    // Backup admins (excluding password hashes)
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('id, username, full_name, faculty, department, role, wallet_address, active, created_at');

    if (adminsError) throw adminsError;

    const backup = {
      timestamp: new Date().toISOString(),
      students: students || [],
      results: results || [],
      admins: admins || [],
    };

    const backupPath = path.join(__dirname, `../backups/backup-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    console.log('✅ Backup created successfully!');
    console.log('📁 Location:', backupPath);
    console.log(`📊 Students: ${students?.length || 0}`);
    console.log(`📊 Results: ${results?.length || 0}`);
    console.log(`📊 Admins: ${admins?.length || 0}`);
  } catch (error: any) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

async function restoreData(backupFile: string): Promise<void> {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Error: Backup file not found:', backupFile);
      process.exit(1);
    }

    console.log('🔄 Restoring data from backup...');
    console.log('⚠️  WARNING: This will overwrite existing data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    // Restore students
    if (backup.students && backup.students.length > 0) {
      console.log(`📝 Restoring ${backup.students.length} students...`);
      const { error } = await supabase.from('students').upsert(backup.students);
      if (error) throw error;
    }

    // Restore results
    if (backup.results && backup.results.length > 0) {
      console.log(`📝 Restoring ${backup.results.length} results...`);
      const { error } = await supabase.from('results').upsert(backup.results);
      if (error) throw error;
    }

    // Restore admins
    if (backup.admins && backup.admins.length > 0) {
      console.log(`📝 Restoring ${backup.admins.length} admins...`);
      const { error } = await supabase.from('admins').upsert(backup.admins);
      if (error) throw error;
    }

    console.log('✅ Data restored successfully!');
  } catch (error: any) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

const command = process.argv[2];

if (command === 'backup') {
  backupData();
} else if (command === 'restore' && process.argv[3]) {
  restoreData(process.argv[3]);
} else {
  console.log('Usage:');
  console.log('  ts-node scripts/migrate-data.ts backup');
  console.log('  ts-node scripts/migrate-data.ts restore <backup-file>');
  console.log('\nExample:');
  console.log('  ts-node scripts/migrate-data.ts backup');
  console.log('  ts-node scripts/migrate-data.ts restore backups/backup-1234567890.json');
  process.exit(1);
}

