import { createContext, useContext, JSX, createMemo, createSignal, createEffect, on } from 'solid-js';
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
  clearBalances: () => void;
  fetchBalances: (refetch?: boolean) => void;
}

const BalanceContext = createContext<BalanceContextType>();

export function BalanceProvider(props: { children: JSX.Element; }) {
  const [balances, setBalances] = createStore<NetworkAssetBalance[]>([]);
  const [loading, setLoading] = createStore<NetworkEnum[]>([]);
  const [networkBalances, setNetworkBalances] = createSignal<NetworkBalances>({});

  const saturnContext = useSaturnContext();
  const toast = useToast();
  const loc = useLocation();

  const allNetworks = Object.values(NetworkEnum);

  const onAssetsPage = createMemo(() => loc.pathname.includes('/assets'));

  const clearBalances = () => {
    setBalances([]);
  };

  const fetchBalances = async () => {
    const nb = networkBalances();

    try {
      if (nb) {
        const networkPromises = Object.entries(nb).map(async ([network, assets], index) => {
          if (Object.keys(assets).length > 0) {
            setTimeout(() => {
              if (!!network) {
                setLoading((l: NetworkEnum[]) => l.filter((n) => n !== network));
              }
            }, 30 + (index * 20));

            const remappedAssets = Object.entries(assets).map(([asset, assetBalances]) => {
              return [asset, assetBalances];
            });
            setBalances((b: NetworkAssetBalance[]) => [...b, [network, remappedAssets] as unknown as NetworkAssetBalance]);
          }
        });

        if (networkPromises.length === 0) return;

        await Promise.all(networkPromises);

        toast.setToast('Balances fetched successfully', 'success');
      }
    } catch (error) {
      console.error(error);
      toast.setToast('Error fetching some balances', 'error');
    } finally {
      setTimeout(() => {
        setLoading([]);
      }, 10 + (allNetworks.length * 20));
    }

  };

  createEffect(on(() => saturnContext.state.multisigAddress, () => {
    const address = saturnContext.state.multisigAddress;

    const loadBalances = async () => {
      if (address) {
        const nBalances = await getBalancesFromAllNetworks(address);
        setNetworkBalances(nBalances);
      }
    };

    loadBalances();
  }));

  createEffect(on([networkBalances, onAssetsPage], () => {
    const nb = networkBalances();
    const onAssets = onAssetsPage();

    if (onAssets) {
      Object.entries(nb).forEach(([network, assets], index) => {
        if (Object.keys(assets).length > 0) {
          setTimeout(() => {
            setLoading((l) => [...l, network as NetworkEnum]);
          }, 5 + (index * 20));
        }
      });

      clearBalances();

      setTimeout(() => {
        fetchBalances();
      }, 1000);
    } else {
      setLoading([]);
    }
  }));

  const value = {
    balances,
    loading,
    clearBalances,
    fetchBalances,
  };

  return (
    <BalanceContext.Provider value={value}>
      {props.children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  if (!BalanceContext) throw new Error('useBalanceContext must be used within a BalanceProvider');
  return useContext(BalanceContext);
}