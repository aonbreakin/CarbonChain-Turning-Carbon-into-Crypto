import { WalletConnect } from "../components/WalletConnect";

export default function Navbar() {
  return (
    <div className="w-full bg-black text-white flex justify-between items-center p-4">
      <h1 className="text-xl font-bold tracking-wide">🌍 CarbonChain</h1>
      <WalletConnect />
    </div>
  );
}
