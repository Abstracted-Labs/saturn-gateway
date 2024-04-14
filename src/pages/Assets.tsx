import { createSignal, For, createEffect, Show, Switch, Match, onCleanup, createMemo, on, onMount } from 'solid-js';
import { AssetEnum, AssetHubEnum, ExtraAssetEnum, NetworksByAsset, Rings } from '../data/rings';
import type { BalanceType } from "../utils/getBalances";
import { formatAsset } from '../utils/formatAsset';
import { getAssetIcon } from '../utils/getAssetIcon';
import { getNetworkIconByAsset } from '../utils/getNetworkIconByAsset';
import { FALLBACK_TEXT_STYLE, NetworkEnum } from '../utils/consts';
import BigNumber from 'bignumber.js';
import { createStore } from 'solid-js/store';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { usePriceContext } from '../providers/priceProvider';
import { useBalanceContext } from '../providers/balanceProvider';
import { useSaturnContext } from '../providers/saturnProvider';
import { getNetworkIconByNetwork } from '../utils/getNetworkIconByNetwork';
import { formatBalance } from '@polkadot/util';

const StakePage = {
  tinkernet_TNKR: 'https://tinker.network/staking',
};

export type NetworkAssetBalance = [string, BalanceType[]];

export type NetworkBalancesArray = [string, NetworkAssetBalance[]];

export const findMatchingAssetKey = (asset: string) => Object.keys(NetworksByAsset).find(key => {
  const normalizedAsset = asset.toLowerCase();
  const normalizedKey = key.toLowerCase();
  const isExactMatch = normalizedAsset === normalizedKey;
  const isContainedMatch = normalizedAsset.includes(normalizedKey) || normalizedKey.includes(normalizedAsset);
  const lengthDifference = Math.abs(normalizedAsset.length - normalizedKey.length);
  const isLikelyPrefixSuffixDifference = lengthDifference <= 2;
  return isExactMatch || (isContainedMatch && isLikelyPrefixSuffixDifference);
});

export default function Assets() {
  const [loading, setLoading] = createSignal<NetworkEnum[]>([]);
  const [balances, setBalances] = createSignal<NetworkAssetBalance[]>([]);
  const [usdValues, setUsdValues] = createStore<Record<string, string>>({});
  const [totalValues, setTotalValues] = createStore<Record<string, string>>({});
  const [usdPrices, setUsdPrices] = createStore<Record<string, string>>({});

  const balanceContext = useBalanceContext();
  const priceContext = usePriceContext();
  const saturn = useSaturnContext();

  const multisigId = createMemo(() => saturn.state.multisigId);
  const getUsdPrices = createMemo(() => priceContext.prices);

  const formatTransferBalance = (asset: AssetEnum | AssetHubEnum | ExtraAssetEnum | string, balance: BalanceType, network: NetworkEnum) => {
    const matchingAssetKey = findMatchingAssetKey(asset);

    if (matchingAssetKey === 'BAILEGO') {
      return balance.freeBalance.toLocaleString();
    }
    const isAssetHubOrExtraAsset = Object.values(AssetHubEnum).includes(matchingAssetKey as AssetHubEnum) || Object.values(ExtraAssetEnum).includes(matchingAssetKey as ExtraAssetEnum);
    if (balance.decimals && isAssetHubOrExtraAsset) {
      return formatAsset(balance.freeBalance, balance.decimals);
    } else {
      return formatAsset(balance.freeBalance, Rings[network]?.decimals ?? 12);
    }
  };

  const formatTotalBalance = (balance: BalanceType, network: NetworkEnum, totalLockAmount: string, asset: AssetEnum | ExtraAssetEnum | string) => {
    const matchingAssetKey = findMatchingAssetKey(asset);

    if (matchingAssetKey === 'BAILEGO') {
      return (+balance.freeBalance + +balance.reservedBalance + +totalLockAmount).toLocaleString();
    }

    const isAssetHubOrExtraAsset = Object.values(AssetHubEnum).includes(matchingAssetKey as AssetHubEnum) || Object.values(ExtraAssetEnum).includes(matchingAssetKey as ExtraAssetEnum);
    if (balance.decimals && isAssetHubOrExtraAsset) {
      return formatAsset((+balance.freeBalance + +balance.reservedBalance + +totalLockAmount).toString(), balance.decimals);
    } else {
      return formatAsset((+balance.freeBalance + +balance.reservedBalance + +totalLockAmount).toString(), Rings[network]?.decimals ?? 12);
    }
  };

  const convertAssetTotalToUsd = (asset: AssetEnum | ExtraAssetEnum, network: NetworkEnum, total: string, decimalFormat?: number) => {
    let totalInUsd = '($0.00)';
    const allPrices = usdPrices;

    if (!allPrices) {
      console.error('Prices not found');
      return totalInUsd;
    };

    let currentMarketPrice = null;

    const matchingAssetKey = findMatchingAssetKey(asset);
    if (matchingAssetKey === AssetEnum.TNKR) {
      const tnkrPrice = allPrices[NetworkEnum.TINKERNET];
      if (tnkrPrice && new BigNumber(tnkrPrice).isGreaterThan(0)) {
        currentMarketPrice = new BigNumber(tnkrPrice);
      } else {
        return totalInUsd;
      }
    } else {
      let specificNetworkPrice: string | null = null;

      if (!matchingAssetKey) {
        console.error(`Matching asset not found for ${ matchingAssetKey }`);
        return totalInUsd;
      }

      if (matchingAssetKey === AssetEnum.KSM) {
        // Get a price for KSM from somewhere
        specificNetworkPrice = allPrices[NetworkEnum.KUSAMA];
      }

      if (Object.values(ExtraAssetEnum).includes(matchingAssetKey as ExtraAssetEnum)) {
        // Handle price retrieval for extra tokens
        specificNetworkPrice = allPrices[matchingAssetKey];
      } else {
        // Handle price retrieval for main tokens
        specificNetworkPrice = allPrices[network];
      }

      if (specificNetworkPrice && new BigNumber(specificNetworkPrice).isGreaterThan(0)) {
        currentMarketPrice = new BigNumber(specificNetworkPrice);
      } else {
        // Handle cases where the price is not available on the network
        const networksHoldingAsset = matchingAssetKey ? (NetworksByAsset as Record<string, string[]>)[matchingAssetKey] : undefined;
        if (networksHoldingAsset) {
          for (const net of networksHoldingAsset) {
            const price = allPrices[net];
            if (price && new BigNumber(price).isGreaterThan(0)) {
              currentMarketPrice = new BigNumber(price);
              break; // Stop once a valid price is found
            }
          }
        }
        if (!currentMarketPrice) currentMarketPrice = new BigNumber(0);
      }
    }

    if (total && currentMarketPrice !== null) {
      let decimals = Object.values(ExtraAssetEnum).includes(matchingAssetKey as ExtraAssetEnum) && decimalFormat ? decimalFormat : Rings[network]?.decimals ?? 12;

      totalInUsd = `($${ formatAsset(new BigNumber(total).times(currentMarketPrice).toString(), decimals, 4) })`;
    } else {
      console.error(`Decimals not found for asset: ${ matchingAssetKey } or market price is $0`);
    }

    return totalInUsd;
  };

  createEffect(on([multisigId], () => {
    setBalances([]);
    const allBalances = balanceContext?.balances;
    setBalances(allBalances as unknown as NetworkAssetBalance[]);
  }));

  createEffect(() => {
    const allPrices = getUsdPrices();

    if (!allPrices) return;

    const loadPrices = () => {
      const pricesInUsd = Object.entries(allPrices).reduce((acc, [network, priceInfo]) => {
        acc[network] = priceInfo.usd;
        return acc;
      }, {} as Record<string, string>);
      setUsdPrices(pricesInUsd);
    };

    loadPrices();
  });

  createEffect(() => {
    // Convert transferable balances to USD
    const userBalances = balances();
    const loadTransferableBalances = () => {
      for (const [network, assets] of userBalances) {
        for (const [asset, b] of assets as unknown as NetworkBalancesArray) {
          const balances = b as unknown as BalanceType;
          if (balances) {
            if (asset === AssetEnum.KSM) {
              const value = convertAssetTotalToUsd(AssetEnum.KSM, NetworkEnum.KUSAMA, balances.freeBalance);
              setUsdValues(usdValues => ({ ...usdValues, [`${ network }-${ asset }`]: value }));
              continue;
            }
            const value = convertAssetTotalToUsd(asset as AssetEnum | ExtraAssetEnum, network as NetworkEnum, balances.freeBalance, balances.decimals);
            setUsdValues(usdValues => ({ ...usdValues, [`${ network }-${ asset }`]: value }));
          } else {
            console.error(`Transferable USD balance not found for ${ asset } on ${ network }`);
          }
        }
      }
    };

    loadTransferableBalances();
  });

  createEffect(() => {
    // Convert total balances to USD
    const userBalances = balances();
    const loadTotalBalances = () => {
      for (const [network, assets] of userBalances) {
        for (const [asset, b] of assets as unknown as NetworkBalancesArray) {
          const balances = b as unknown as BalanceType;
          const totalLockAmount = !!balances.locks && balances.locks.length > 0 ? balances.locks.reduce((acc, lock) => acc + parseInt(lock.amount.toString()), 0).toString() : '0';
          if (balances) {
            const totalBalance = +balances.freeBalance + +balances.reservedBalance + +totalLockAmount;
            if (asset === AssetEnum.KSM) {
              const value = convertAssetTotalToUsd(AssetEnum.KSM, NetworkEnum.KUSAMA, totalBalance.toString());
              setTotalValues(totalValues => ({ ...totalValues, [`${ network }-${ asset }`]: value }));
              continue;
            }
            const value = convertAssetTotalToUsd(asset as AssetEnum | ExtraAssetEnum, network as NetworkEnum, totalBalance.toString(), balances.decimals);
            setTotalValues(totalValues => ({ ...totalValues, [`${ network }-${ asset }`]: value }));
          } else {
            console.error(`Total USD balance not found for ${ asset } on ${ network }`);
          }
        }
      }
    };

    loadTotalBalances();
  });

  const renderLoadingAnimations = () => {
    const loadingNetworks = balanceContext?.loading;
    if (!loadingNetworks || loadingNetworks.length === 0) return;
    return (
      <For each={Array.from(loadingNetworks)}>
        {(network) => {
          const icon = () => getNetworkIconByNetwork(network) ? <img src={getNetworkIconByNetwork(network as NetworkEnum)} alt="network icon" class="inline-block mr-1" /> : network;
          const name = network.charAt(0).toUpperCase() + network.slice(1);
          return <div class="flex flex-col justify-start py-1 ml-3 mt-2">
            <LoaderAnimation text={
              <span class="flex flex-row items-center justify-start">
                Loading assets from <span class="pl-2">{icon()}</span> {name}
              </span>
            } />
          </div>;
        }}
      </For>
    );
  };

  return (
    <>
      <div class="relative saturn-scrollbar overflow-x-auto overscroll-contain min-h-64 h-full flex flex-col content-stretch">
        <table class="w-full text-sm text-left text-saturn-lightgrey">
          <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
            <tr>
              <th scope="col" class='py-3 px-4 text-left w-[20%]'>Asset</th>
              <th scope="col" class='py-3 px-4 text-left w-[30%]'>Transferable</th>
              <th scope="col" class='py-3 px-4 text-left w-[30%]'>Total</th>
              <th scope="col" class='w-[20%]'>Chains</th>
            </tr>
          </thead>
          <Switch fallback={!balanceContext?.loading.length && <div class="mt-3 ml-3"><LoaderAnimation text="Gathering info..." /></div>}>
            <Match when={balances() && balances().length > 0}>
              <For each={balances()}>{([network, assets]) => {
                return <Show when={assets.length}>
                  <tbody class="dark:text-saturn-offwhite text-saturn-black">
                    <For each={assets as unknown as [string, BalanceType][]}>{([asset, b]) => {
                      const totalLockAmount = !!b.locks && b.locks.length > 0 ? b.locks.reduce((acc, lock) => acc + parseInt(lock.amount.toString()), 0).toString() : '0';
                      return <tr class="border-b border-gray-200 dark:border-gray-800">
                        {/* Asset */}
                        <td class='py-3 px-4 text-left w-[20%]'>
                          <span class="flex flex-row items-center gap-1">
                            <span class='h-5 w-5 flex rounded-full bg-black'>
                              <img src={getAssetIcon(asset, network as NetworkEnum, asset === AssetEnum.PHA)} class="p-1" alt={asset} />
                            </span>
                            <span>
                              {asset}
                            </span>
                          </span>
                        </td>

                        {/* Transferable */}
                        <td class='py-3 px-4 text-left w-[30%]'>
                          <span class="flex flex-row items-baseline gap-1">
                            <span>
                              {formatTransferBalance(asset as AssetEnum | ExtraAssetEnum, b, network as NetworkEnum)}
                            </span>
                            <span class="text-[9px]">{asset}</span>
                            <span class="text-saturn-lightgrey text-[8px]">
                              {usdValues[`${ network }-${ asset }`]}
                            </span>
                          </span>
                        </td>

                        {/* Total */}
                        <td class='py-3 px-4 text-left w-[30%]'>
                          <span class="flex flex-row items-baseline gap-1">
                            <span>
                              {formatTotalBalance(b, network as NetworkEnum, totalLockAmount, asset as AssetEnum | ExtraAssetEnum)}
                            </span>
                            <span class="text-[9px]">{asset}</span>
                            <span class="text-saturn-lightgrey text-[8px]">
                              {totalValues[`${ network }-${ asset }`]}
                            </span>
                          </span>
                        </td>

                        {/* Chains */}
                        <td>
                          <span class="flex flex-row items-center gap-1">
                            <For each={[getNetworkIconByAsset(asset, !Object.values(AssetEnum).includes(asset as AssetEnum) ? network as NetworkEnum : undefined)].flat().filter(icon => icon.toLowerCase().includes(network.toLowerCase()))}>
                              {icon =>
                                <span class='h-5 w-5 flex rounded-full bg-black'>
                                  <img src={icon} class="p-1" alt="asset-icon" />
                                </span>
                              }
                            </For>
                          </span>
                        </td>

                      </tr>;
                    }
                    }</For>
                  </tbody>
                </Show>;
              }
              }</For>
            </Match>
          </Switch>
        </table>
        {renderLoadingAnimations()}
      </div>
    </>
  );
}
