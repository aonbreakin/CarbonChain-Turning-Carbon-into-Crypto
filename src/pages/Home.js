import React from 'react';
import Dashboard from '../components/Dashboard';
import WalletConnect from '../components/WalletConnect';

const Home = () => {
  const handleWalletConnect = (address) => {
    console.log('Connected wallet:', address);
  };

  return (
    <div className="page">
      <h1>🌍 CarbonChain Dashboard</h1>
      <WalletConnect onConnect={handleWalletConnect} />
      <Dashboard />
    </div>
  );
};

export default Home;