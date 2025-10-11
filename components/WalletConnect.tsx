import { useEffect, useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";

export const WalletConnect = () => {
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    await web3Enable("CarbonChain");
    const allAccounts = await web3Accounts();
    if (allAccounts.length > 0) setAccount(allAccounts[0].address);
  };

  return (
    <button
      onClick={connectWallet}
      className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-2xl font-semibold text-black"
    >
      {account ? `Connected: ${account.slice(0, 8)}...` : "Connect Wallet"}
    </button>
  );
};
