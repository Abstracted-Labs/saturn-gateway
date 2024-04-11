import { BigNumber } from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AssetEnum, AssetHubAssetIdEnum, Rings } from '../data/rings';
import { PalletBalancesBalanceLock } from '@polkadot/types/lookup';
import { FeeAsset } from '@invarch/saturn-sdk';
import { NetworkEnum } from './consts';
import { createApis } from './createApis';
import { formatBalance, hexToString, u8aToString } from '@polkadot/util';
import { formatAsset } from './formatAsset';

const SUB_ID_START_URL = 'https://sub.id/api/v1/';

export interface BalanceType {
  freeBalance: string;
  reservedBalance: string;
  totalBalance: string;
  locks?: PalletBalancesBalanceLock[];
  decimals?: number;
};

export type ResultBalances = Record<string, BalanceType>;

export type ResultBalancesWithNetwork = Record<string, ResultBalances | [number, number]>;

export type NetworkBalances = {
  [Property in keyof typeof Rings]: ResultBalances;
};

async function getAssetRegistryByNetwork(network: NetworkEnum, api: ApiPromise): Promise<Record<string, string | FeeAsset | number | [number, number]>> {
  const assetRegistry: Record<string, string | FeeAsset | number | [number, number]> = {};

  switch (network) {
    case NetworkEnum.BASILISK: {
      if (api.query.assetRegistry && 'assetMetadataMap' in api.query.assetRegistry && typeof api.query.assetRegistry.assetMetadataMap === 'function') {
        const registryMap = await (api.query.assetRegistry.assetMetadataMap as any).entries();
        registryMap.reduce((acc: Record<string, string | FeeAsset | number>, [key, value]: [any, any]) => {
          const metadata = value.toJSON();
          const assetId = Number(key.toHuman());
          const symbol = hexToString(metadata.symbol);
          if (!Number.isNaN(assetId) && symbol) {
            acc[symbol] = assetId;
          }
          return acc;
        }, assetRegistry);
      } else {
        console.warn('assetsRegistry or assetMetadataMap not available on BASILISK network');
      }
      break;
    }

    case NetworkEnum.PICASSO: {
      if (api.query.assetsRegistry && api.query.assetsRegistry.assetSymbol) {
        const registryMap = await (api.query.assetsRegistry.assetSymbol as any).entries();
        registryMap.reduce((acc: Record<string, string | FeeAsset | number>, [key, value]: [any, any]) => {
          const metadata = value.toJSON();
          const assetId = Number(key.toHuman());
          const symbol = hexToString(metadata.symbol);
          if (!Number.isNaN(assetId) && symbol) {
            acc[symbol] = assetId;
          }
          return acc;
        }, assetRegistry);
      } else {
        console.warn('assetsRegistry or assetSymbol not available on PICASSO network');
      }
      break;
    }

    case NetworkEnum.ASSETHUB: {
      if (api.query.assets && api.query.assets.metadata) {
        try {
          const registryMap = await api.query.assets.metadata.entries();
          for (const [key, value] of registryMap) {
            const metadata = value.toJSON();
            const storageKey = key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, '');
            if (!storageKey) {
              console.warn('Invalid storageKey:', storageKey);
              continue;
            };
            const assetId = parseInt(storageKey, 10);
            const symbol = metadata && typeof metadata === 'object' && 'symbol' in metadata && metadata['symbol'] ? hexToString(metadata['symbol'].toString()) : null;
            const decimals = metadata && typeof metadata === 'object' && 'decimals' in metadata && metadata['decimals'] ? metadata['decimals'] : null;
            if (!Number.isNaN(assetId) && symbol) {
              if (assetId === parseInt(AssetHubAssetIdEnum.BILL) || assetId === parseInt(AssetHubAssetIdEnum.BAILEGO)) {
                if (decimals !== null) {
                  assetRegistry[symbol] = [assetId, Number(decimals)];
                } else {
                  assetRegistry[symbol] = [assetId, 0];
                }
              }
            } else {
              console.warn('Invalid assetId or symbol:', { assetId, symbol });
            }
          }
        } catch (error) {
          console.error('Error retrieving entries from ASSETHUB network:', error);
        }
      } else {
        console.warn('assets or metadata not available on ASSETHUB network');
      }
      break;
    }

    case NetworkEnum.BIFROST: {

      break;
    }

    // NetworkEnum.TINKERNET
    default: {
      assetRegistry[AssetEnum.TNKR] = FeeAsset.Native;
      assetRegistry[AssetEnum.KSM] = FeeAsset.Relay;
      break;
    }
  }

  return assetRegistry;
}

export async function getBalancesFromNetwork(api: ApiPromise, address: string, network: NetworkEnum): Promise<ResultBalancesWithNetwork> {
  const balancesByNetwork: ResultBalances = {};

  switch (network) {
    case NetworkEnum.BASILISK: {
      if (api) {
        // query balances 
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.BSX] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.BASILISK, api);
        for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
          const tokens = await api.query.tokens.accounts(address, assetId as number);
          const freeTokens = tokens.free.toString();
          const reservedTokens = tokens.reserved.toString();
          const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();
          balancesByNetwork[assetSymbol] = {
            freeBalance: freeTokens,
            reservedBalance: reservedTokens,
            totalBalance: totalTokens,
          };
        }
      }
      break;
    }

    case NetworkEnum.PICASSO: {
      if (api) {
        // query balances 
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.PICA] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.PICASSO, api);
        for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
          const tokens = await api.query.tokens.accounts(address, assetId as number);
          const freeTokens = tokens.free.toString();
          const reservedTokens = tokens.reserved.toString();
          const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();
          balancesByNetwork[assetSymbol] = {
            freeBalance: freeTokens,
            reservedBalance: reservedTokens,
            totalBalance: totalTokens,
          };
        }
      }
      break;
    }

    case NetworkEnum.KUSAMA: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.KSM] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    case NetworkEnum.ASSETHUB: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.KSM] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        if (api.query.assets) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.ASSETHUB, api);
          for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
            const tokens = await api.query.assets.account((assetId as [number, number])[0], address);
            const balanceFromJson = tokens.toJSON() as unknown as { balance: string, status: string; };
            const decimals = (assetId as [number, number])[1];
            if (!balanceFromJson) continue;
            const freeTokens = balanceFromJson.balance;
            if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
              continue;
            }
            balancesByNetwork[assetSymbol] = {
              freeBalance: freeTokens,
              reservedBalance: '0',
              totalBalance: freeTokens,
              decimals,
            };
          }
        }
      }
      break;
    }

    case NetworkEnum.BIFROST: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.BNC] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        // const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.BIFROST, api);
        // for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
        //   const tokens = await api.query.tokens.accounts(address, assetId as number);
        //   const freeTokens = tokens.free.toString();
        //   const reservedTokens = tokens.reserved.toString();
        //   const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();
        //   balancesByNetwork[assetSymbol] = {
        //     freeBalance: freeTokens,
        //     reservedBalance: reservedTokens,
        //     totalBalance: totalTokens,
        //   };
        // }
      }
      break;
    }

    case NetworkEnum.KHALA: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.KPHA] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    case NetworkEnum.KARURA: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.KAR] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    case NetworkEnum.MOONRIVER: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.MOVR] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    case NetworkEnum.SHIDEN: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.SDN] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    case NetworkEnum.TURING: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.TUR] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };
      }
      break;
    }

    // NetworkEnum.TINKERNET
    default: {
      if (api) {
        // query balances 
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
        const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.TNKR] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.TINKERNET, api);
        if (assetRegistry) {
          for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
            const tokens = await api.query.tokens.accounts(address, assetId as number);
            const freeTokens = tokens.free.toString();
            const reservedTokens = tokens.reserved.toString();
            const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();

            if (balancesByNetwork[assetSymbol]) {
              const existingFreeBalance = new BigNumber(balancesByNetwork[assetSymbol].freeBalance);
              const existingReservedBalance = new BigNumber(balancesByNetwork[assetSymbol].reservedBalance);
              const existingTotalBalance = new BigNumber(balancesByNetwork[assetSymbol].totalBalance);

              const newFreeTokens = new BigNumber(freeTokens);
              const newReservedTokens = new BigNumber(reservedTokens);

              const updatedFreeBalance = existingFreeBalance.plus(newFreeTokens).toString();
              const updatedReservedBalance = existingReservedBalance.plus(newReservedTokens).toString();
              const updatedTotalBalance = existingTotalBalance.plus(newFreeTokens).plus(newReservedTokens).toString();

              balancesByNetwork[assetSymbol] = {
                freeBalance: updatedFreeBalance,
                reservedBalance: updatedReservedBalance,
                totalBalance: updatedTotalBalance,
                locks,
              };
            } else {
              balancesByNetwork[assetSymbol] = {
                freeBalance: freeTokens,
                reservedBalance: reservedTokens,
                totalBalance: totalTokens,
              };
            }
          }
        }
      }
      break;
    }
  }

  // Filter out zero or NaN balances
  for (const [key, value] of Object.entries(balancesByNetwork)) {
    if (new BigNumber(value.totalBalance).isZero() || new BigNumber(value.totalBalance).isNaN()) {
      delete balancesByNetwork[key];
    }
  }

  api.disconnect();
  return ({ [network]: balancesByNetwork });
}

export async function getBalancesFromAllNetworks(address: string): Promise<NetworkBalances> {
  const apis = await createApis();
  const promises = Object.entries(Rings).map(async ([network, networkData]) => {
    const api = apis[network as NetworkEnum];
    return getBalancesFromNetwork(api, 'i4zA33U9GQnNfqT4avPUWS8q8uJ45R3VexohLNxrgECRi6TAo', network as NetworkEnum);
  });
  const results: ResultBalancesWithNetwork[] = await Promise.all(promises);
  const allBalances: NetworkBalances = Object.assign({}, ...results);

  return allBalances;
}