# CarbonChain Backend - Complete Setup Guide

## 🏗️ Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  IoT Devices    │─────▶│  Oracle Nodes    │─────▶│  Substrate      │
│  (Edge)         │      │  (Aggregation)   │      │  Parachain      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │                         │
                                  ▼                         ▼
                         ┌──────────────────┐      ┌─────────────────┐
                         │  IPFS Storage    │      │  Indexer/API    │
                         │  (Telemetry)     │      │  (PostgreSQL)   │
                         └──────────────────┘      └─────────────────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  Frontend dApp  │
                                                   │  (React/Next)   │
                                                   └─────────────────┘
```

## 📋 Prerequisites

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **Rust**: Latest stable ([Install](https://rustup.rs/))
- **Substrate**: For local development ([Docs](https://docs.substrate.io/install/))
- **Docker**: Optional, for containers ([Install](https://docs.docker.com/get-docker/))
- **PostgreSQL**: v14+ for indexer
- **Redis**: For caching (optional)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-org/carbonchain-backend
cd carbonchain-backend

# Install Node.js dependencies
npm install

# Build TypeScript
npm run build
```

### 2. Setup Substrate Development Chain

```bash
# Option A: Use substrate-node-template
git clone https://github.com/substrate-developer-hub/substrate-node-template
cd substrate-node-template

# Build the node (takes 10-30 minutes first time)
cargo build --release

# Run development chain
./target/release/node-template --dev --tmp

# Chain will be accessible at ws://127.0.0.1:9944
```

```bash
# Option B: Use Docker (faster for testing)
docker run -p 9944:9944 -p 9933:9933 \
  parity/substrate:latest \
  --dev --ws-external --rpc-external
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
# Polkadot Connection
WS_ENDPOINT=ws://127.0.0.1:9944
CHAIN_NAME=development

# Oracle Node Configuration
ORACLE_SEED=//Alice
ORACLE_PORT=3001
MIN_ORACLE_NODES=3

# API Server
API_PORT=3000
API_HOST=0.0.0.0

# Database (for indexer)
DATABASE_URL=postgresql://carbonchain:password@localhost:5432/carbonchain
REDIS_URL=redis://localhost:6379

# IPFS
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Security
JWT_SECRET=your-secret-key-here
RATE_LIMIT=100

# Logging
LOG_LEVEL=info
```

### 4. Deploy Substrate Pallets

```bash
# Add pallets to your runtime
cd substrate-node-template/runtime

# Edit Cargo.toml to include pallets:
# device-registry = { path = "../../pallets/device-registry" }
# oracle = { path = "../../pallets/oracle" }
# cet-token = { path = "../../pallets/cet-token" }
# dao-governance = { path = "../../pallets/dao-governance" }

# Build runtime with pallets
cargo build --release

# Restart node
./target/release/node-template --dev --tmp
```

### 5. Start Backend Services

```bash
# Terminal 1: Start Oracle Node
npm run oracle

# Terminal 2: Start API Server
npm run api

# Or start both together
npm start
```

### 6. Initialize On-Chain Data

```bash
# Use Polkadot.js Apps UI
# Navigate to: https://polkadot.js.org/apps/?rpc=ws://127.0.0.1:9944

# 1. Add Oracle Nodes
# Developer > Extrinsics > oracle.addOracleNode(oracleAddress)

# 2. Whitelist Manufacturers
# Developer > Extrinsics > deviceRegistry.whitelistManufacturer("CarbonTech")

# 3. Register Test Device
# Developer > Extrinsics > deviceRegistry.registerDevice(...)
```

## 🔧 Advanced Configuration

### Multi-Node Oracle Setup

Deploy 3+ oracle nodes for production:

```bash
# Node 1
ORACLE_SEED=//Alice ORACLE_PORT=3001 npm run oracle

# Node 2
ORACLE_SEED=//Bob ORACLE_PORT=3002 npm run oracle

# Node 3
ORACLE_SEED=//Charlie ORACLE_PORT=3003 npm run oracle
```

### Database Setup (Indexer)

```sql
-- Create database
CREATE DATABASE carbonchain;

-- Create tables
CREATE TABLE devices (
    device_id VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    pubkey TEXT NOT NULL,
    manufacturer VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) REFERENCES devices(device_id),
    timestamp BIGINT NOT NULL,
    co2_captured BIGINT NOT NULL,
    energy_produced BIGINT NOT NULL,
    data_hash TEXT NOT NULL,
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE proposals (
    proposal_id INTEGER PRIMARY KEY