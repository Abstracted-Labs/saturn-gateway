import { createContext, useContext, createEffect, onCleanup, JSX, createMemo } from 'solid-js';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { useSaturnContext } from "./saturnProvider";
import { useSelectedAccountContext } from './selectedAccountProvider';
import { createStore } from 'solid-js/store';
import { NetworkAssetBalance } from '../pages/Assets';

export interface BalanceContextType {
  balances: NetworkAssetBalance[];
  fetchBalances: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType>();

export function BalanceProvider(props: { children: JSX.Element; }) {
  const [balances, setBalances] = createStore<NetworkAssetBalance[]>([]);
  const saturnContext = useSaturnContext();
  const saContext = useSelectedAccountContext();

  const fetchBalances = async () => {
    const id = saturnContext.state.multisigId;
    const address = saturnContext.state.multisigAddress;
    const walletAddress = saContext.state.account?.address;

    if (typeof id !== 'number' || !address || !walletAddress) {
      console.log('Invalid multisig id or address', id, address, walletAddress);
      return;
    }

    const nb = await getBalancesFromAllNetworks(address);
    const remapped = Object.entries(nb).map(([network, assets]) => {
      return [network, Object.entries(assets).map(([asset, assetBalances]) => {
        return [asset, assetBalances];
      })];
    });

    setBalances(remapped as unknown as NetworkAssetBalance[]);
  };

  createEffect(() => {
    fetchBalances();
  });

  onCleanup(() => {
    setBalances([]);
  });

  const value = createMemo(() => ({ balances, fetchBalances }));

  return (
    <BalanceContext.Provider value={value()}>
      {props.children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  if (!BalanceContext) {
    throw new Error("useBalanceContext must be used within a BalanceProvider");
  }

  return useContext(BalanceContext);
}