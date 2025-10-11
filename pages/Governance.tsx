import { usePolkadot } from "../hooks/usePolkadot";
import { useState, useEffect } from "react";

export default function Governance() {
  const { api, ready } = usePolkadot();
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const p = await api.query.democracy.publicProps();
      setProposals(p.toHuman());
    })();
  }, [ready]);

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">🗳 DAO Governance</h2>
      <pre className="bg-gray-900 p-4 rounded">{JSON.stringify(proposals, null, 2)}</pre>
    </div>
  );
}
