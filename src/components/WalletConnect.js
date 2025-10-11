import React, { useState } from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';

const WalletConnect = ({ onConnect }) => {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    const extensions = await web3Enable('CarbonChain');
    if (extensions.length === 0) {
      alert('Please install Polkadot.js extension');
      return;
    }

    const accounts = await web3Accounts();
    if (accounts.length > 0) {
      setAccount(accounts[0].address);
      onConnect(accounts[0].address);
    }
  };

  return (
    <div className="wallet-connect">
      {account ? (
        <p>Connected: {account}</p>
      ) : (
        <button onClick={connectWallet} className="btn-primary">
          Connect Polkadot Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;