// ============================================================================
// CarbonChain Backend Services - Complete Polkadot Integration
// ============================================================================

// ============================================================================
// 1. Oracle Node Service (Node.js/TypeScript)
// ============================================================================

import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

// Oracle Configuration
interface OracleConfig {
  wsEndpoint: string;
  oracleSeed: string;
  port: number;
  minOracleNodes: number;
}

interface TelemetryData {
  deviceId: string;
  timestamp: number;
  co2Captured: number; // grams
  energyProduced: number; // watt-hours
  deviceSignature: string;
  nonce: number;
}

interface AggregatedReport {
  deviceId: string;
  timestamp: number;
  co2Captured: number;
  energyProduced: number;
  dataHash: string;
  oracleSignatures: Array<{ oracle: string; signature: string }>;
  nonce: number;
}

class OracleNode {
  private api: ApiPromise | null = null;
  private keyring: Keyring | null = null;
  private oracleAccount: any = null;
  private config: OracleConfig;
  private app: express.Application;
  private pendingReports: Map<string, TelemetryData[]> = new Map();

  constructor(config: OracleConfig) {
    this.config = config;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Oracle Node...');
    
    await cryptoWaitReady();
    
    // Connect to Polkadot parachain
    const provider = new WsProvider(this.config.wsEndpoint);
    this.api = await ApiPromise.create({ provider });
    
    console.log(`✅ Connected to chain: ${(await this.api.rpc.system.chain()).toString()}`);
    
    // Initialize oracle account
    this.keyring = new Keyring({ type: 'sr25519' });
    this.oracleAccount = this.keyring.addFromUri(this.config.oracleSeed);
    
    console.log(`📍 Oracle Address: ${this.oracleAccount.address}`);
    
    // Subscribe to chain events
    this.subscribeToEvents();
    
    // Setup REST API endpoints
    this.setupAPI();
  }

  // Subscribe to on-chain events
  subscribeToEvents(): void {
    if (!this.api) return;

    this.api.query.system.events((events) => {
      events.forEach((record) => {
        const { event } = record;
        
        if (event.section === 'deviceRegistry' && event.method === 'DeviceRegistered') {
          console.log('📱 New Device Registered:', event.data.toString());
        }
        
        if (event.section === 'oracle' && event.method === 'TelemetryVerified') {
          console.log('✅ Telemetry Verified:', event.data.toString());
        }
      });
    });
  }

  // Verify device signature
  verifyDeviceSignature(data: TelemetryData, devicePubKey: string): boolean {
    try {
      // Create message to verify
      const message = `${data.deviceId}:${data.timestamp}:${data.co2Captured}:${data.energyProduced}:${data.nonce}`;
      const messageHash = crypto.createHash('sha256').update(message).digest();
      
      // In production, implement proper ed25519/sr25519 signature verification
      // This is a simplified version
      return data.deviceSignature.length > 0;
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return false;
    }
  }

  // Generate data hash for telemetry
  generateDataHash(data: TelemetryData): string {
    const payload = `${data.deviceId}:${data.timestamp}:${data.co2Captured}:${data.energyProduced}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  // Sign data as oracle
  signData(dataHash: string): string {
    const signature = this.oracleAccount.sign(hexToU8a('0x' + dataHash));
    return u8aToHex(signature);
  }

  // Submit telemetry to chain
  async submitTelemetryToChain(report: AggregatedReport): Promise<void> {
    if (!this.api || !this.oracleAccount) return;

    try {
      console.log('📤 Submitting telemetry to chain...');
      
      // Convert data to proper format
      const dataHashArray = Array.from(hexToU8a('0x' + report.dataHash));
      const oracleSigs = report.oracleSignatures.map(sig => [sig.oracle, sig.signature]);
      
      // Submit extrinsic
      const tx = this.api.tx.oracle.submitTelemetry(
        report.deviceId,
        report.timestamp,
        report.co2Captured,
        report.energyProduced,
        dataHashArray,
        report.nonce,
        oracleSigs
      );

      await tx.signAndSend(this.oracleAccount, ({ status, dispatchError }) => {
        if (status.isInBlock) {
          console.log(`✅ Telemetry included in block: ${status.asInBlock}`);
        }
        
        if (status.isFinalized) {
          console.log(`🎉 Telemetry finalized in block: ${status.asFinalized}`);
        }

        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
            console.error(`❌ Error: ${decoded.section}.${decoded.name}: ${decoded.docs}`);
          } else {
            console.error(`❌ Error: ${dispatchError.toString()}`);
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to submit telemetry:', error);
    }
  }

  // Aggregate telemetry from multiple sources
  async aggregateTelemetry(deviceId: string): Promise<AggregatedReport | null> {
    const reports = this.pendingReports.get(deviceId) || [];
    
    if (reports.length < this.config.minOracleNodes) {
      console.log(`⏳ Waiting for more confirmations (${reports.length}/${this.config.minOracleNodes})`);
      return null;
    }

    // Calculate average values
    const avgCo2 = Math.round(
      reports.reduce((sum, r) => sum + r.co2Captured, 0) / reports.length
    );
    const avgEnergy = Math.round(
      reports.reduce((sum, r) => sum + r.energyProduced, 0) / reports.length
    );

    const aggregated: AggregatedReport = {
      deviceId: reports[0].deviceId,
      timestamp: reports[0].timestamp,
      co2Captured: avgCo2,
      energyProduced: avgEnergy,
      dataHash: this.generateDataHash(reports[0]),
      oracleSignatures: [],
      nonce: reports[0].nonce,
    };

    // Sign with this oracle
    const signature = this.signData(aggregated.dataHash);
    aggregated.oracleSignatures.push({
      oracle: this.oracleAccount!.address,
      signature: signature,
    });

    // Clear pending reports
    this.pendingReports.delete(deviceId);

    return aggregated;
  }

  // Setup REST API
  setupAPI(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        oracle: this.oracleAccount?.address,
        connected: this.api !== null,
      });
    });

    // Receive telemetry from edge devices
    this.app.post('/telemetry', async (req, res) => {
      try {
        const data: TelemetryData = req.body;
        
        console.log(`📥 Received telemetry from device: ${data.deviceId}`);

        // Verify device exists and is active
        const device = await this.api?.query.deviceRegistry.devices(data.deviceId);
        if (!device || device.isEmpty) {
          return res.status(404).json({ error: 'Device not found' });
        }

        // Verify signature
        const deviceData: any = device.toJSON();
        if (!this.verifyDeviceSignature(data, deviceData.pubkey)) {
          return res.status(401).json({ error: 'Invalid device signature' });
        }

        // Add to pending reports
        if (!this.pendingReports.has(data.deviceId)) {
          this.pendingReports.set(data.deviceId, []);
        }
        this.pendingReports.get(data.deviceId)!.push(data);

        // Try to aggregate
        const aggregated = await this.aggregateTelemetry(data.deviceId);
        if (aggregated) {
          await this.submitTelemetryToChain(aggregated);
          return res.json({ status: 'submitted', report: aggregated });
        }

        res.json({ status: 'pending', message: 'Waiting for more confirmations' });
      } catch (error: any) {
        console.error('❌ Error processing telemetry:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Get oracle info
    this.app.get('/info', async (req, res) => {
      try {
        const chain = await this.api?.rpc.system.chain();
        const nodeName = await this.api?.rpc.system.name();
        const nodeVersion = await this.api?.rpc.system.version();
        
        res.json({
          oracle: this.oracleAccount?.address,
          chain: chain?.toString(),
          node: nodeName?.toString(),
          version: nodeVersion?.toString(),
          wsEndpoint: this.config.wsEndpoint,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.listen(this.config.port, () => {
      console.log(`🌐 Oracle API listening on port ${this.config.port}`);
    });
  }

  async start(): Promise<void> {
    await this.initialize();
    console.log('✅ Oracle Node is running');
  }
}

// ============================================================================
// 2. API Server & Indexer Service
// ============================================================================

class CarbonChainAPI {
  private api: ApiPromise | null = null;
  private app: express.Application;
  private wsEndpoint: string;
  private port: number;

  constructor(wsEndpoint: string, port: number) {
    this.wsEndpoint = wsEndpoint;
    this.port = port;
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing CarbonChain API...');
    
    await cryptoWaitReady();
    const provider = new WsProvider(this.wsEndpoint);
    this.api = await ApiPromise.create({ provider });
    
    console.log(`✅ Connected to chain: ${(await this.api.rpc.system.chain()).toString()}`);
    
    this.setupRoutes();
  }

  setupRoutes(): void {
    // Get all devices
    this.app.get('/api/devices', async (req, res) => {
      try {
        const entries = await this.api?.query.deviceRegistry.devices.entries();
        const devices = entries?.map(([key, value]) => {
          const deviceId = key.args[0].toString();
          const device: any = value.toJSON();
          return { deviceId, ...device };
        });
        res.json({ devices });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get device by ID
    this.app.get('/api/devices/:deviceId', async (req, res) => {
      try {
        const { deviceId } = req.params;
        const device = await this.api?.query.deviceRegistry.devices(deviceId);
        
        if (!device || device.isEmpty) {
          return res.status(404).json({ error: 'Device not found' });
        }
        
        res.json({ deviceId, device: device.toJSON() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get devices by owner
    this.app.get('/api/devices/owner/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const deviceIds = await this.api?.query.deviceRegistry.devicesByOwner(address);
        
        const devices = [];
        if (deviceIds) {
          const ids: any = deviceIds.toJSON();
          for (const id of ids) {
            const device = await this.api?.query.deviceRegistry.devices(id);
            if (device && !device.isEmpty) {
              devices.push({ deviceId: id, ...device.toJSON() });
            }
          }
        }
        
        res.json({ owner: address, devices });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get telemetry reports for device
    this.app.get('/api/telemetry/:deviceId', async (req, res) => {
      try {
        const { deviceId } = req.params;
        const reports = await this.api?.query.oracle.telemetryReports(deviceId);
        res.json({ deviceId, reports: reports?.toJSON() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get CET token balance
    this.app.get('/api/balance/:address', async (req, res) => {
      try {
        const { address } = req.params;
        const balance = await this.api?.query.cetToken.balances(address);
        const pending = await this.api?.query.cetToken.pendingRewards(address);
        
        res.json({
          address,
          balance: balance?.toString(),
          pendingRewards: pending?.toString(),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get total CET supply
    this.app.get('/api/token/supply', async (req, res) => {
      try {
        const supply = await this.api?.query.cetToken.totalSupply();
        res.json({ totalSupply: supply?.toString() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get all proposals
    this.app.get('/api/proposals', async (req, res) => {
      try {
        const count = await this.api?.query.daoGovernance.proposalCount();
        const proposalCount = count ? parseInt(count.toString()) : 0;
        
        const proposals = [];
        for (let i = 0; i < proposalCount; i++) {
          const proposal = await this.api?.query.daoGovernance.proposals(i);
          if (proposal && !proposal.isEmpty) {
            proposals.push({ id: i, ...proposal.toJSON() });
          }
        }
        
        res.json({ proposals });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get proposal by ID
    this.app.get('/api/proposals/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const proposal = await this.api?.query.daoGovernance.proposals(parseInt(id));
        
        if (!proposal || proposal.isEmpty) {
          return res.status(404).json({ error: 'Proposal not found' });
        }
        
        res.json({ id, proposal: proposal.toJSON() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get chain statistics
    this.app.get('/api/stats', async (req, res) => {
      try {
        const totalSupply = await this.api?.query.cetToken.totalSupply();
        const proposalCount = await this.api?.query.daoGovernance.proposalCount();
        const latestBlock = await this.api?.rpc.chain.getBlock();
        
        // Calculate total CO2 captured (aggregate from all telemetry)
        const deviceEntries = await this.api?.query.deviceRegistry.devices.entries();
        let totalCo2 = 0;
        let totalEnergy = 0;
        
        if (deviceEntries) {
          for (const [key] of deviceEntries) {
            const deviceId = key.args[0].toString();
            const reports = await this.api?.query.oracle.telemetryReports(deviceId);
            const reportsData: any = reports?.toJSON();
            
            if (reportsData && Array.isArray(reportsData)) {
              for (const report of reportsData) {
                totalCo2 += report.co2Captured || 0;
                totalEnergy += report.energyProduced || 0;
              }
            }
          }
        }
        
        res.json({
          totalCETSupply: totalSupply?.toString(),
          totalProposals: proposalCount?.toString(),
          latestBlock: latestBlock?.block.header.number.toString(),
          totalCo2Captured: totalCo2,
          totalEnergyProduced: totalEnergy,
          activeDevices: deviceEntries?.length || 0,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Chain info
    this.app.get('/api/info', async (req, res) => {
      try {
        const chain = await this.api?.rpc.system.chain();
        const nodeName = await this.api?.rpc.system.name();
        const nodeVersion = await this.api?.rpc.system.version();
        const health = await this.api?.rpc.system.health();
        
        res.json({
          chain: chain?.toString(),
          nodeName: nodeName?.toString(),
          nodeVersion: nodeVersion?.toString(),
          health: health?.toJSON(),
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // WebSocket endpoint for real-time updates
    this.app.get('/api/subscribe', (req, res) => {
      res.json({
        message: 'Use WebSocket connection to ws://localhost:' + this.port + '/ws',
      });
    });

    this.app.listen(this.port, () => {
      console.log(`🌐 CarbonChain API listening on port ${this.port}`);
    });
  }

  async start(): Promise<void> {
    await this.initialize();
    console.log('✅ CarbonChain API is running');
  }
}

// ============================================================================
// 3. Main Entry Point - Start Services
// ============================================================================

async function main() {
  console.log('🌱 CarbonChain Backend Services Starting...\n');

  // Oracle Node Configuration
  const oracleConfig: OracleConfig = {
    wsEndpoint: 'ws://127.0.0.1:9944', // Local Substrate node
    oracleSeed: '//Alice', // Use proper seed in production
    port: 3001,
    minOracleNodes: 3,
  };

  // API Server Configuration
  const apiPort = 3000;
  const apiWsEndpoint = 'ws://127.0.0.1:9944';

  try {
    // Start Oracle Node
    const oracle = new OracleNode(oracleConfig);
    await oracle.start();
    
    console.log('');
    
    // Start API Server
    const api = new CarbonChainAPI(apiWsEndpoint, apiPort);
    await api.start();
    
    console.log('\n✅ All services started successfully!');
    console.log(`\n📍 Oracle Node: http://localhost:${oracleConfig.port}`);
    console.log(`📍 API Server: http://localhost:${apiPort}`);
    console.log(`\n📖 API Endpoints:`);
    console.log(`   GET  /api/devices - Get all devices`);
    console.log(`   GET  /api/devices/:deviceId - Get device by ID`);
    console.log(`   GET  /api/telemetry/:deviceId - Get device telemetry`);
    console.log(`   GET  /api/balance/:address - Get CET balance`);
    console.log(`   GET  /api/proposals - Get all proposals`);
    console.log(`   GET  /api/stats - Get chain statistics`);
    console.log(`   POST /telemetry - Submit telemetry (Oracle endpoint)`);
    
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { OracleNode, CarbonChainAPI };
