# Scripts Directory

This directory contains utility scripts for setting up, deploying, and managing the Tamper-Proof Academic Records System.

## Available Scripts

### Setup Scripts

#### `setup-database.ts`
Displays the database schema SQL for manual setup in Supabase.

```bash
ts-node scripts/setup-database.ts
```

#### `create-admin.ts`
Creates an initial admin account for the system.

```bash
ts-node scripts/create-admin.ts <username> <password> <fullName> <role>
```

Example:
```bash
ts-node scripts/create-admin.ts admin securepass123 "Admin User" registry_staff
```

Roles: `faculty`, `department_head`, `registry_staff`

#### `verify-contract.ts`
Provides instructions for verifying the deployed contract on PolygonScan.

```bash
ts-node scripts/verify-contract.ts <contractAddress> <network>
```

Example:
```bash
ts-node scripts/verify-contract.ts 0x123... polygon
```

### Utility Scripts

#### `check-env.ts`
Checks if all required environment variables are set.

```bash
ts-node scripts/check-env.ts <component>
```

Components: `backend`, `frontend`, `contracts`, or `all`

Example:
```bash
ts-node scripts/check-env.ts all
```

#### `install-all.ts`
Installs all npm dependencies for contracts, backend, and frontend.

```bash
ts-node scripts/install-all.ts
```

#### `build-all.ts`
Builds all components (contracts, backend, frontend) for production.

```bash
ts-node scripts/build-all.ts
```

## Prerequisites

- Node.js 18+
- TypeScript installed globally or as dev dependency
- ts-node installed globally or as dev dependency

## Installation

To install ts-node globally:
```bash
npm install -g ts-node typescript
```

Or install locally in the project root:
```bash
npm install --save-dev ts-node typescript
```

## Usage

All scripts should be run from the project root directory:

```bash
ts-node scripts/<script-name>.ts [arguments]
```

## Notes

- Make sure to set up `.env` files before running scripts that require environment variables
- The `create-admin.ts` script requires the backend server to be running
- Some scripts provide instructions rather than executing actions directly for security reasons

