# Tamper-Proof Academic Records System

A production-ready decentralized academic records management system for the University of Benin that ensures result integrity through blockchain technology.

## Architecture

- **Frontend**: React + TailwindCSS (Student Portal, Faculty Admin Panel, Public Verification Portal)
- **Backend**: Node.js + Express (REST API, WebSocket, Authentication)
- **Smart Contract**: Solidity (Polygon mainnet)
- **Database**: Supabase (PostgreSQL)
- **Storage**: IPFS (Pinata/Web3.Storage)
- **Wallet**: Reown (WalletConnect)

## Project Structure

```
tamper-proof/
├── contracts/          # Solidity smart contracts
├── backend/            # Express API server
├── frontend/           # React application
├── docs/               # Documentation
└── scripts/            # Deployment and utility scripts
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Supabase account
- IPFS pinning service account (Pinata/Web3.Storage)
- Polygon mainnet access

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../contracts && npm install
   ```

3. Configure environment variables (see `.env.example` files)

4. Deploy smart contract:
   ```bash
   cd contracts
   npm run deploy
   ```

5. Run backend:
   ```bash
   cd backend
   npm run dev
   ```

6. Run frontend:
   ```bash
   cd frontend
   npm start
   ```

## Documentation

See `/docs` directory for detailed documentation:
- API Documentation
- Smart Contract Documentation
- Deployment Guide
- User Manuals

## License

MIT
