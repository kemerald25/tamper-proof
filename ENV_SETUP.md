# Environment Variables Setup Guide

This project requires environment variables to be configured in three locations:
1. **contracts/** - For smart contract deployment
2. **backend/** - For the API server
3. **frontend/** - For the React application

## Quick Setup

For each folder, copy the `.env.example` file to `.env` and fill in your actual values:

```bash
# Contracts
cd contracts
cp .env.example .env
# Edit .env with your values

# Backend
cd ../backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

## Required Services & APIs

### 1. Contracts Environment
- **Polygon Wallet**: Create a wallet and get the private key
- **RPC Provider**: Get a free RPC URL from Alchemy, Infura, or use public endpoints
- **PolygonScan API**: Get API key from https://polygonscan.com/myapikey (for contract verification)

### 2. Backend Environment
- **Supabase**: Create a project at https://supabase.com
  - Get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from project settings
- **Redis**: Install locally or use a cloud service (Redis Cloud, Upstash)
- **IPFS**: Use public gateway or set up your own node
- **Pinata**: Create account at https://pinata.cloud for IPFS pinning
- **Blockchain**: Same wallet as contracts (for submitting records)
- **JWT Secret**: Generate with: `openssl rand -hex 32`

### 3. Frontend Environment
- **Reown (WalletConnect)**: Create project at https://cloud.reown.com
  - Get `REACT_APP_WALLETCONNECT_PROJECT_ID` from project dashboard
- **API URL**: Point to your backend server URL

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` files to version control
- `.env.example` files are safe to commit (they contain placeholders only)
- Keep private keys and API keys secure
- Use different keys for development and production
- Rotate secrets regularly in production

## Next Steps

1. Copy all `.env.example` files to `.env`
2. Fill in your actual values
3. Make sure `.env` is in `.gitignore` (already configured)
4. Start the development servers:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

For detailed setup instructions, see `docs/SETUP.md`
