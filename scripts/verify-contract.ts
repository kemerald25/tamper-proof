#!/usr/bin/env ts-node

/**
 * Contract Verification Script
 * 
 * Verifies the deployed contract on PolygonScan.
 * 
 * Usage:
 *   ts-node scripts/verify-contract.ts <contractAddress> <network>
 * 
 * Example:
 *   ts-node scripts/verify-contract.ts 0x123... polygon
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../contracts/.env') });

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: ts-node scripts/verify-contract.ts <contractAddress> <network>');
  console.log('\nNetworks: polygon | mumbai');
  console.log('\nExample:');
  console.log('  ts-node scripts/verify-contract.ts 0x123... polygon');
  process.exit(1);
}

const [contractAddress, network] = args;

console.log('🔍 Contract Verification');
console.log('=======================\n');
console.log('Contract Address:', contractAddress);
console.log('Network:', network);
console.log('\n📋 Instructions:');
console.log('1. Go to https://polygonscan.com (or https://mumbai.polygonscan.com for Mumbai)');
console.log('2. Navigate to your contract address');
console.log('3. Click on "Contract" tab');
console.log('4. Click "Verify and Publish"');
console.log('5. Select "Via Standard JSON Input"');
console.log('6. Upload your contract ABI and source files');
console.log('\n💡 Alternatively, use Hardhat verify:');
console.log(`   cd contracts && npx hardhat verify --network ${network} ${contractAddress}`);

