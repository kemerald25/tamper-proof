#!/usr/bin/env ts-node

/**
 * Create Admin Account Script
 * 
 * Creates the initial admin account for the system.
 * 
 * Usage:
 *   ts-node scripts/create-admin.ts <username> <password> <fullName> <role>
 * 
 * Example:
 *   ts-node scripts/create-admin.ts admin securepass123 "Admin User" registry_staff
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const API_URL = process.env.REACT_APP_API_URL || process.env.API_URL || 'http://localhost:3001/api';

interface AdminData {
  username: string;
  password: string;
  fullName: string;
  role: 'faculty' | 'department_head' | 'registry_staff';
  faculty?: string;
  department?: string;
  walletAddress?: string;
}

async function createAdmin(adminData: AdminData): Promise<void> {
  try {
    console.log('👤 Creating admin account...');
    console.log('Username:', adminData.username);
    console.log('Full Name:', adminData.fullName);
    console.log('Role:', adminData.role);
    console.log('');

    const response = await axios.post(`${API_URL}/auth/admin/register`, adminData);

    console.log('✅ Admin account created successfully!');
    console.log('📋 Admin Details:');
    console.log('   ID:', response.data.admin.id);
    console.log('   Username:', response.data.admin.username);
    console.log('   Full Name:', response.data.admin.fullName);
    console.log('   Role:', response.data.admin.role);
    console.log('\n🔑 Token:', response.data.token);
    console.log('\n💡 Save this token for API authentication');
  } catch (error: any) {
    console.error('❌ Error creating admin account:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.error || error.response.data.message);
    } else {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('Usage: ts-node scripts/create-admin.ts <username> <password> <fullName> <role>');
  console.log('\nRoles: faculty | department_head | registry_staff');
  console.log('\nExample:');
  console.log('  ts-node scripts/create-admin.ts admin securepass123 "Admin User" registry_staff');
  process.exit(1);
}

const [username, password, fullName, role] = args;

if (!['faculty', 'department_head', 'registry_staff'].includes(role)) {
  console.error('❌ Invalid role. Must be: faculty, department_head, or registry_staff');
  process.exit(1);
}

createAdmin({
  username,
  password,
  fullName,
  role: role as AdminData['role'],
});

