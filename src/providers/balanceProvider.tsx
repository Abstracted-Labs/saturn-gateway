import { createContext, useContext, JSX, createMemo, onCleanup, createEffect, createSignal, onMount } from 'solid-js';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { useSaturnContext } from "./saturnProvider";
import { useSelectedAccountContext } from './selectedAccountProvider';
import { createStore } from 'solid-js/store';
import { NetworkAssetBalance } from '../pages/Assets';
import { createLocalStorage } from '@solid-primitives/storage';

export interface BalanceContextType {
  balances: NetworkAssetBalance[];
  loading: boolean;
  clearBalances: () => void;
  fetchBalances: (refetch?: boolean) => void;
}

const BalanceContext = createContext<BalanceContextType>();

export function BalanceProvider(props: { children: JSX.Element; }) {
  const [balances, setBalances] = createStore<NetworkAssetBalance[]>([]);
  const [sessionBalances, setSessionBalances, { remove }] = createLocalStorage<NetworkAssetBalance[]>({});
  const [loading, setLoading] = createSignal<boolean>(true);

  const saturnContext = useSaturnContext();

  const clearBalances = () => {
    remove('omniwayBalances');
    setBalances([]);
  };

  const fetchBalances = async (refetch?: boolean) => {
    const id = saturnContext.state.multisigId;
    const address = saturnContext.state.multisigAddress;

    if (typeof id !== 'number' || !address) {
      console.log('Invalid multisig id or address', id, address);
      return;
    }

    if (sessionBalances['omniwayBalances'] && !refetch) {
      try {
        const storedBalances = JSON.parse(sessionBalances['omniwayBalances']);
        if (Array.isArray(storedBalances) && storedBalances.length > 0) {
          console.log('Using stored balances');
          setBalances(storedBalances);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored balances', error);
        setLoading(false);
      }
    } else {
      console.log('No stored balances found');
    }

    try {
      console.log('Fetching new balances');
      const nb = await getBalancesFromAllNetworks(address);
      const remapped = Object.entries(nb).map(([network, assets]) => {
        return [network, Object.entries(assets).map(([asset, assetBalances]) => {
          return [asset, assetBalances];
        })];
      });

      console.log('Setting new balances');
      setBalances(remapped as unknown as NetworkAssetBalance[]);
      setSessionBalances('omniwayBalances', JSON.stringify(remapped));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balances', error);
      setLoading(false);
    }
  };

  createEffect(() => {
    fetchBalances();
  });

  const value = createMemo(() => ({ balances, loading: loading(), clearBalances, fetchBalances }));

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