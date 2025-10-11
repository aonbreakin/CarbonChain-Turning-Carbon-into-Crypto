import { ApiPromise, WsProvider } from '@polkadot/api';

let api;

export const initPolkadot = async () => {
  if (api) return api;

  const provider = new WsProvider('wss://rpc.polkadot.io');
  api = await ApiPromise.create({ provider });
  return api;
};

export const getBlockNumber = async () => {
  const api = await initPolkadot();
  const header = await api.rpc.chain.getHeader();
  return header.number.toNumber();
};