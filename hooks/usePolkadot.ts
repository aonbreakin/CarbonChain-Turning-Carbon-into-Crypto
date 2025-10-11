import { useEffect, useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

export const usePolkadot = () => {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const provider = new WsProvider("wss://rpc.polkadot.io");
      const api = await ApiPromise.create({ provider });
      setApi(api);
      setReady(true);
    };
    init();
  }, []);

  return { api, ready };
};
