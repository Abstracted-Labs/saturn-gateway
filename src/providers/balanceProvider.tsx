import { createContext, useContext, JSX, createMemo, createSignal, onMount, createEffect, on } from 'solid-js';
import { NetworkBalances, getBalancesFromAllNetworks } from '../utils/getBalances';
import { useSaturnContext } from "./saturnProvider";
import { NetworkAssetBalance } from '../pages/Assets';
import { useToast } from './toastProvider';
import { NetworkEnum } from '../utils/consts';
import { createStore } from 'solid-js/store';
import { useLocation } from '@solidjs/router';

export interface BalanceContextType {
  balances: NetworkAssetBalance[];
  loading: NetworkEnum[];
  fetchedOnce: boolean;
  clearBalances: () => void;
  fetchBalances: (refetch?: boolean) => void;
}

const BalanceContext = createContext<BalanceContextType>();

export function BalanceProvider(props: { children: JSX.Element; }) {
  const [balances, setBalances] = createStore<NetworkAssetBalance[]>([]);
  const [loading, setLoading] = createStore<NetworkEnum[]>([]);
  const [fetchedOnce, setFetchedOnce] = createSignal(false);
  const [networkBalances, setNetworkBalances] = createSignal<NetworkBalances>({});

  const saturnContext = useSaturnContext();
  const toast = useToast();
  const loc = useLocation();

  const allNetworks = Object.values(NetworkEnum);

  const onAssetsPage = createMemo(() => loc.pathname.includes('/assets'));
  const multisigId = createMemo(() => saturnContext.state.multisigId);
  const multisigAddress = createMemo(() => saturnContext.state.multisigAddress);
  // const allBalances = createMemo(() => balances);
  // const allLoading = createMemo(() => loading);

  const clearBalances = () => {
    setBalances([]);
  };

  const fetchBalances = async () => {
    const id = multisigId();
    const address = multisigAddress();
    const nb = networkBalances();

    if (typeof id !== 'number' || !address) {
      console.log({ id, address });
      console.error('No multisig id or address found');
      return;
    };

    try {
      if (networkBalances()) {
        const networkPromises = Object.entries(nb).map(async ([network, assets], index) => {
          if (Object.keys(assets).length > 0) {
            setTimeout(() => {
              setLoading((l: NetworkEnum[]) => l.filter((n) => n !== network));
            }, index * 100);

            const remappedAssets = Object.entries(assets).map(([asset, assetBalances]) => {
              return [asset, assetBalances];
            });
            setBalances((b: NetworkAssetBalance[]) => [...b, [network, remappedAssets] as unknown as NetworkAssetBalance]);
          }
        });

        await Promise.all(networkPromises);

        setFetchedOnce(true);

        toast.setToast('Balances fetched successfully', 'success');
      }
    } catch (error) {
      console.error(error);
      toast.setToast('Error fetching some balances', 'error');
    } finally {
      setTimeout(() => {
        setLoading([]);
      }, 500 + (allNetworks.length * 100));
    }

  };

  createEffect(on(multisigAddress, () => {
    const multisigId = multisigAddress();

    const loadBalances = async () => {
      if (multisigId) {
        const nBalances = await getBalancesFromAllNetworks(multisigId);
        setNetworkBalances(nBalances);
      }
    };

    loadBalances();
  }));

  createEffect(on([networkBalances, onAssetsPage], () => {
    const nb = networkBalances();
    const onAssets = onAssetsPage();

    if (onAssets) {
      const networksToLoad = Object.entries(nb).filter(([_, assets]) => Object.keys(assets).length > 0).map(([network, _]) => network as NetworkEnum);
      setLoading(networksToLoad);

      clearBalances();

      setTimeout(() => {
        fetchBalances();
      }, 2000);
    } else {
      setLoading([]);
    }
  }));

  const value = createMemo(() => ({
    balances,
    loading,
    fetchedOnce: fetchedOnce(),
    clearBalances,
    fetchBalances,
  }));

  return (
    <BalanceContext.Provider value={value()}>
      {props.children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  if (!BalanceContext) throw new Error('useBalanceContext must be used within a BalanceProvider');
  return useContext(BalanceContext);
}