# Setup Guide

Complete setup guide for the Tamper-Proof Academic Records System.

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account
- IPFS pinning service account (Pinata recommended)
- Polygon mainnet wallet with MATIC
- Reown (WalletConnect) project ID

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/tamper-proof.git
cd tamper-proof
```

### 2. Set Up Database

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `docs/database-schema.sql` in the Supabase SQL editor
3. Save your Supabase URL and Service Role Key

### 3. Deploy Smart Contract

```bash
cd contracts
npm install
```

Create `.env` file:
```env
PRIVATE_KEY=your_private_key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your_api_key
```

Deploy:
```bash
npm run deploy:polygon
```

Save the contract address.

### 4. Set Up Backend

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

REDIS_URL=redis://localhost:6379

IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_GATEWAY=https://ipfs.io/ipfs/
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address

LOG_LEVEL=info
```

Start the server:
```bash
npm run dev
```

### 5. Set Up Frontend

```bash
cd frontend
npm install
```

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id
```

Start the development server:
```bash
npm start
```

### 6. Configure Reown (WalletConnect)

1. Create an account at https://cloud.reown.com
2. Create a new project
3. Get your Project ID
4. Add it to the frontend `.env` file

### 7. Create Initial Admin Account

Use the admin registration endpoint:
```bash
curl -X POST http://localhost:3001/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure_password",
    "fullName": "Admin User",
    "role": "registry_staff"
  }'
```

## Development

### Running Tests

Backend:
```bash
cd backend
npm test
```

Contracts:
```bash
cd contracts
npm test
```

### Building for Production

Backend:
```bash
cd backend
npm run build
```

Frontend:
```bash
cd frontend
npm run build
```

## Common Issues

### Port Already in Use

Change the PORT in `.env` file or kill the process using the port.

### Database Connection Failed

Verify Supabase credentials and ensure the database is accessible.

### Wallet Not Connecting

Check that Reown Project ID is correct and wallet extension is enabled.

### IPFS Upload Failing

Verify Pinata API keys and check network connectivity.

## Next Steps

- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- See [API.md](./API.md) for API documentation
- See [USER_GUIDE.md](./USER_GUIDE.md) for user instructions

