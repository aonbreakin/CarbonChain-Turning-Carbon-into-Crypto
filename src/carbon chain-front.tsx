import React, { useState, useEffect } from 'react';
import { Camera, Zap, Leaf, TrendingUp, Plus, CheckCircle, AlertCircle, Wallet, Vote, RefreshCw } from 'lucide-react';

const CarbonChainApp = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState({ DOT: 0, CET: 0 });
  const [devices, setDevices] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const connectWallet = async () => {
    setLoading(true);
    setTimeout(() => {
      setAccount({
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'Carbon Capture Node'
      });
      setBalance({ DOT: 12.5, CET: 847.32 });
      loadInitialData();
      showNotification('Wallet connected successfully', 'success');
      setLoading(false);
    }, 1000);
  };

  const loadInitialData = () => {
    setDevices([
      {
        id: 'DEVICE-001',
        name: 'Carbon Capture Unit Alpha',
        status: 'active',
        location: 'Bangkok, TH',
        co2Captured: 245.8,
        energyProduced: 123.4,
        lastUpdate: new Date().toISOString(),
        pubkey: '0x1a2b3c...'
      },
      {
        id: 'DEVICE-002',
        name: 'Carbon Capture Unit Beta',
        status: 'active',
        location: 'Chiang Mai, TH',
        co2Captured: 189.2,
        energyProduced: 94.6,
        lastUpdate: new Date(Date.now() - 3600000).toISOString(),
        pubkey: '0x4d5e6f...'
      }
    ]);

    const now = Date.now();
    setTelemetry([
      { time: now - 7200000, co2: 220, energy: 110 },
      { time: now - 5400000, co2: 235, energy: 118 },
      { time: now - 3600000, co2: 240, energy: 120 },
      { time: now - 1800000, co2: 245, energy: 123 },
      { time: now, co2: 250, energy: 125 }
    ]);

    setProposals([
      {
        id: 'PROP-001',
        title: 'Increase CET Mint Rate by 10%',
        description: 'Proposal to increase token rewards per kWh',
        votesFor: 12450,
        votesAgainst: 3200,
        status: 'active',
        endTime: Date.now() + 86400000 * 3
      },
      {
        id: 'PROP-002',
        title: 'Add New Device Manufacturer to Whitelist',
        description: 'Approve GreenTech Solutions as certified manufacturer',
        votesFor: 8900,
        votesAgainst: 1100,
        status: 'active',
        endTime: Date.now() + 86400000 * 5
      }
    ]);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const registerDevice = async (deviceData) => {
    setLoading(true);
    setTimeout(() => {
      const newDevice = {
        id: `DEVICE-${String(devices.length + 1).padStart(3, '0')}`,
        name: deviceData.name,
        status: 'pending',
        location: deviceData.location,
        co2Captured: 0,
        energyProduced: 0,
        lastUpdate: new Date().toISOString(),
        pubkey: deviceData.pubkey
      };
      setDevices([...devices, newDevice]);
      showNotification('Device registration submitted to chain', 'success');
      setLoading(false);
      setActiveTab('dashboard');
    }, 1500);
  };

  const claimRewards = async () => {
    setLoading(true);
    setTimeout(() => {
      const rewards = 45.8;
      setBalance(prev => ({ ...prev, CET: prev.CET + rewards }));
      showNotification(`Claimed ${rewards} CET tokens`, 'success');
      setLoading(false);
    }, 1000);
  };

  const voteOnProposal = async (proposalId, support) => {
    setLoading(true);
    setTimeout(() => {
      setProposals(proposals.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            votesFor: support ? p.votesFor + 100 : p.votesFor,
            votesAgainst: !support ? p.votesAgainst + 100 : p.votesAgainst
          };
        }
        return p;
      }));
      showNotification('Vote submitted successfully', 'success');
      setLoading(false);
    }, 1000);
  };

  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Leaf className="w-6 h-6" />}
          title="Total CO₂ Captured"
          value="435.0 kg"
          change="+12.5%"
          positive
        />
        <StatCard
          icon={<Zap className="w-6 h-6" />}
          title="Energy Produced"
          value="218.0 kWh"
          change="+8.3%"
          positive
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="CET Balance"
          value={`${balance.CET.toFixed(2)} CET`}
          change="+45.8 pending"
          positive
        />
        <StatCard
          icon={<Camera className="w-6 h-6" />}
          title="Active Devices"
          value={devices.filter(d => d.status === 'active').length}
          change={`${devices.length} total`}
        />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Live Telemetry</h2>
          <button className="text-green-400 hover:text-green-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="h-64 flex items-end justify-around gap-2">
          {telemetry.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col gap-2">
              <div
                className="bg-green-500 rounded-t transition-all hover:bg-green-400"
                style={{ height: `${(data.co2 / 250) * 100}%` }}
                title={`CO₂: ${data.co2}kg`}
              />
              <div
                className="bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                style={{ height: `${(data.energy / 125) * 100}%` }}
                title={`Energy: ${data.energy}kWh`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-300">CO₂ Captured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-gray-300">Energy Produced</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">My Devices</h2>
          <button
            onClick={() => setActiveTab('register')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
        <div className="space-y-3">
          {devices.map(device => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-6 border border-green-500/30">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Claimable Rewards</h3>
            <p className="text-3xl font-bold text-green-400">45.8 CET</p>
            <p className="text-gray-400 text-sm mt-1">From verified energy production</p>
          </div>
          <button
            onClick={claimRewards}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );

  const RegisterDevice = () => {
    const [formData, setFormData] = useState({
      name: '',
      location: '',
      manufacturer: '',
      pubkey: ''
    });

    const handleSubmit = () => {
      if (formData.name && formData.location && formData.manufacturer && formData.pubkey) {
        registerDevice(formData);
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Register New Device</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Device Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-green-500 outline-none"
                placeholder="Carbon Capture Unit Gamma"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-green-500 outline-none"
                placeholder="Bangkok, TH"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Manufacturer</label>
              <select
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-green-500 outline-none"
              >
                <option value="">Select manufacturer</option>
                <option value="carbontech">CarbonTech Industries</option>
                <option value="greentech">GreenTech Solutions</option>
                <option value="ecosphere">EcoSphere Systems</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Device Public Key</label>
              <input
                type="text"
                value={formData.pubkey}
                onChange={(e) => setFormData({ ...formData, pubkey: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-green-500 outline-none font-mono text-sm"
                placeholder="0x..."
              />
              <p className="text-gray-400 text-sm mt-1">Provided by device secure element</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Register Device
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DAOGovernance = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">DAO Governance</h2>
        <p className="text-gray-400">Vote on proposals using your CET tokens</p>
        <div className="mt-4 flex gap-4">
          <div className="bg-gray-700 rounded-lg p-4 flex-1">
            <p className="text-gray-400 text-sm">Your Voting Power</p>
            <p className="text-2xl font-bold text-white mt-1">{balance.CET.toFixed(2)} CET</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 flex-1">
            <p className="text-gray-400 text-sm">Active Proposals</p>
            <p className="text-2xl font-bold text-white mt-1">{proposals.filter(p => p.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {proposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={voteOnProposal}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );

  const StatCard = ({ icon, title, value, change, positive }) => (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {change && (
        <div className={`text-sm ${positive ? 'text-green-400' : 'text-gray-400'}`}>
          {change}
        </div>
      )}
    </div>
  );

  const DeviceCard = ({ device }) => (
    <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-semibold">{device.name}</h3>
          <p className="text-gray-400 text-sm">{device.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          device.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {device.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">CO₂ Captured</p>
          <p className="text-white font-semibold">{device.co2Captured} kg</p>
        </div>
        <div>
          <p className="text-gray-400">Energy Produced</p>
          <p className="text-white font-semibold">{device.energyProduced} kWh</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400">
        <p>Location: {device.location}</p>
        <p>Last update: {new Date(device.lastUpdate).toLocaleString()}</p>
      </div>
    </div>
  );

  const ProposalCard = ({ proposal, onVote, loading }) => {
    const totalVotes = proposal.votesFor + proposal.votesAgainst;
    const forPercent = (proposal.votesFor / totalVotes) * 100;
    const daysLeft = Math.ceil((proposal.endTime - Date.now()) / 86400000);

    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">{proposal.title}</h3>
            <p className="text-gray-400 text-sm">{proposal.description}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
            {daysLeft} days left
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-400">For: {proposal.votesFor.toLocaleString()}</span>
            <span className="text-red-400">Against: {proposal.votesAgainst.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              style={{ width: `${forPercent}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onVote(proposal.id, true)}
            disabled={loading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Vote For
          </button>
          <button
            onClick={() => onVote(proposal.id, false)}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Vote Against
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Leaf className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                CarbonChain
              </h1>
            </div>
            {account ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Connected</div>
                  <div className="font-mono text-sm">{account.address.slice(0, 8)}...{account.address.slice(-6)}</div>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <div className="text-xs text-gray-400">CET Balance</div>
                  <div className="font-bold text-green-400">{balance.CET.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {account ? (
        <>
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'dashboard' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'register' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Register Device
              </button>
              <button
                onClick={() => setActiveTab('dao')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  activeTab === 'dao' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Vote className="w-4 h-4" />
                DAO
              </button>
            </div>

            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'register' && <RegisterDevice />}
            {activeTab === 'dao' && <DAOGovernance />}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <Leaf className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Welcome to CarbonChain</h2>
          <p className="text-xl text-gray-400 mb-8">
            Polkadot-native dApp for carbon capture verification and CET token management
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6">
              <Camera className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">IoT Device Registry</h3>
              <p className="text-gray-400 text-sm">Register and manage carbon capture devices with verified telemetry</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">CET Token Rewards</h3>
              <p className="text-gray-400 text-sm">Earn tokens for verified CO₂ to energy conversion events</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <Vote className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">DAO Governance</h3>
              <p className="text-gray-400 text-sm">Vote on proposals and shape the future of CarbonChain</p>
            </div>
          </div>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 mx-auto"
          >
            <Wallet className="w-6 h-6" />
            Connect Polkadot Wallet
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Supports Polkadot.js Extension, Talisman, SubWallet
          </p>
        </div>
      )}

      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-bold mb-3 text-green-400">Built on Polkadot</h4>
              <p className="text-gray-400">Leveraging Substrate runtime and ink! smart contracts for secure, scalable carbon verification</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-green-400">Oracle Network</h4>
              <p className="text-gray-400">Multi-node verification using Chainlink-style aggregation for trusted telemetry</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-green-400">Decentralized Storage</h4>
              <p className="text-gray-400">IPFS anchoring for telemetry data with on-chain hash verification</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            CarbonChain © 2025 - Powered by Polkadot Ecosystem
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CarbonChainApp;
