# Deployment Guide

This guide provides step-by-step instructions for deploying the Tamper-Proof Academic Records System to production.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- IPFS pinning service account (Pinata, Web3.Storage, or NFT.Storage)
- Polygon mainnet wallet with MATIC for gas fees
- Domain name with SSL certificate
- Server or cloud hosting (AWS, Heroku, Vercel, etc.)

## Step 1: Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema from `docs/database-schema.sql` in the Supabase SQL editor
3. Note your Supabase URL and Service Role Key
4. Configure Row Level Security policies as needed

## Step 2: Smart Contract Deployment

1. Navigate to the contracts directory:
   ```bash
   cd contracts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with:
   ```
   PRIVATE_KEY=your_private_key_here
   POLYGON_RPC_URL=https://polygon-rpc.com
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   ```

4. Deploy the contract:
   ```bash
   npm run deploy:polygon
   ```

5. Note the contract address from the deployment output

6. Verify the contract on PolygonScan:
   ```bash
   npm run verify
   ```

## Step 3: Backend Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with all required environment variables (see `.env.example`)

4. Build the application:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

### Environment Variables for Backend

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

REDIS_URL=redis://your-redis-url:6379

IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_GATEWAY=https://ipfs.io/ipfs/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

POLYGON_RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

LOG_LEVEL=info
```

## Step 4: Frontend Deployment

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   REACT_APP_API_URL=https://api.your-domain.com/api
   REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. Build the application:
   ```bash
   npm run build
   ```

5. Deploy the `build` folder to your hosting service (Vercel, Netlify, AWS S3, etc.)

### Environment Variables for Frontend

```env
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## Step 5: Configure Reown (WalletConnect)

1. Create an account at https://cloud.reown.com
2. Create a new project
3. Get your Project ID
4. Add your domain to allowed origins
5. Update the frontend `.env` file with the Project ID

## Step 6: IPFS Configuration

1. Sign up for a pinning service (Pinata recommended)
2. Get your API key and secret key
3. Update the backend `.env` file with your credentials
4. Configure IPFS gateway for public access

## Step 7: Redis Setup (Optional but Recommended)

1. Set up a Redis instance (Redis Cloud, AWS ElastiCache, etc.)
2. Get your Redis connection URL
3. Update the backend `.env` file with the Redis URL

## Step 8: SSL Certificate

1. Set up SSL certificates for your domain (Let's Encrypt recommended)
2. Configure HTTPS on your server
3. Update CORS settings in backend to allow your frontend domain

## Step 9: Monitoring and Logging

1. Set up error tracking (Sentry, LogRocket, etc.)
2. Configure logging service (Winston logs, CloudWatch, etc.)
3. Set up uptime monitoring (UptimeRobot, Pingdom, etc.)

## Step 10: Initial Admin Account

1. Use the admin registration endpoint to create the first admin account:
   ```bash
   curl -X POST https://api.your-domain.com/api/auth/admin/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "secure_password",
       "fullName": "Admin User",
       "role": "registry_staff"
     }'
   ```

## Production Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Smart contract deployed and verified
- [ ] Backend API accessible and healthy
- [ ] Frontend deployed and accessible
- [ ] SSL certificates configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing completed

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is in backend CORS configuration
2. **Database Connection Errors**: Verify Supabase credentials and network access
3. **Blockchain Transaction Failures**: Check gas prices and wallet balance
4. **IPFS Upload Failures**: Verify API keys and network connectivity
5. **Wallet Connection Issues**: Check Reown project ID and allowed origins

## Support

For issues and questions, please refer to the documentation or contact the development team.

