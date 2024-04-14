import { BigNumber } from 'bignumber.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AssetEnum, AssetHubAssetIdEnum, RingAssets, Rings } from '../data/rings';
import { PalletBalancesBalanceLock } from '@polkadot/types/lookup';
import { FeeAsset } from '@invarch/saturn-sdk';
import { NetworkEnum } from './consts';
import { createApis } from './createApis';
import { bnToU8a, formatBalance, hexToNumber, hexToString, u8aToBigInt, u8aToString } from '@polkadot/util';
import { formatAsset } from './formatAsset';
import { isEthereumAddress } from '@polkadot/util-crypto';
import { determineType } from './determineType';

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

async function getAssetRegistryByNetwork(network: NetworkEnum, api: ApiPromise): Promise<Record<string, string | FeeAsset | number | [number | string, number]>> {
  const assetRegistry: Record<string, string | FeeAsset | number | [number | string, number]> = {};

  switch (network) {
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

    case NetworkEnum.BIFROST: {
      if (api.query.assetRegistry && 'assetMetadatas' in api.query.assetRegistry) {
        try {
          const registryMap = await (api.query.assetRegistry.assetMetadatas as any).entries();
          for (const [_, value] of registryMap) {
            const metadata = value.toJSON() as unknown as { symbol: string, decimals: number; };
            if (!metadata) {
              console.warn('Invalid metadata:', metadata);
              continue;
            }
            const symbol = hexToString(metadata.symbol);
            const decimals = metadata.decimals;
            if (symbol && !Number.isNaN(decimals)) {
              assetRegistry[symbol] = [symbol, Number(decimals)];
            } else {
              console.warn('Invalid symbol or decimals:', { symbol, decimals });
            }
          }
        } catch (error) {
          console.error('Error retrieving entries from BIFROST network:', error);
        }
      } else {
        console.warn('assets or assetMetadatas not available on BIFROST network');
      }
      break;
    }

    case NetworkEnum.KARURA: {
      if (api.query.assetRegistry && 'assetMetadatas' in api.query.assetRegistry) {
        try {
          const registryMap = await (api.query.assetRegistry.assetMetadatas as any).entries();
          for (const [_, value] of registryMap) {
            const metadata = value.toHuman() as unknown as { symbol: string, decimals: string; };
            if (!metadata) {
              console.warn('Invalid metadata:', metadata);
              continue;
            }
            const symbol = metadata.symbol;
            const decimals = metadata.decimals;
            if (symbol && !Number.isNaN(decimals)) {
              assetRegistry[symbol] = [symbol, Number(decimals)];
            } else {
              console.warn('Invalid symbol or decimals:', { symbol, decimals });
            }
          }
        } catch (error) {
          console.error('Error retrieving entries from KARURA network:', error);
        }
      }
      break;
    }

    case NetworkEnum.KHALA: {
      if (api.query.assets && 'metadata' in api.query.assets) {
        try {
          const registryMap = await api.query.assets.metadata.entries();
          const storageKeys = registryMap.map(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, ''));
          storageKeys.forEach((storageKey) => {
            if (!storageKey) {
              console.warn('Invalid storageKey:', storageKey);
              return;
            }

            const metadata = registryMap.find(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, '') === storageKey);
            const symbol = metadata && typeof metadata[1] === 'object' && 'symbol' in metadata[1] && metadata[1]['symbol'] ? hexToString(metadata[1]['symbol'].toString()) : null;
            const decimals = metadata && typeof metadata[1] === 'object' && 'decimals' in metadata[1] && metadata[1]['decimals'] ? metadata[1]['decimals'].toString() : null;
            const isTypeU32 = determineType(storageKey) === 'u32';
            if (!isTypeU32) {
              // console.warn('Invalid type:', storageKey);
              return;
            }
            if (symbol) {
              assetRegistry[symbol] = [storageKey, Number(decimals)];
            } else {
              console.warn('Skipping non-u32 asset:', { storageKey, symbol });
            }
          });
        } catch (error) {
          console.error('Error retrieving entries from KHALA network:', error);
        }
      } else {
        console.warn('assets or assetMetadatas not available on KHALA network');
      }
      break;
    }

    case NetworkEnum.MOONRIVER: {
      if (api.query.assets && 'asset' in api.query.assets && 'metadata' in api.query.assets) {
        const registryMap = await api.query.assets.asset.entries();
        const storageKeys = registryMap.map(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, ''));
        const moonriverAssets = await api.query.assets.metadata.entries();
        storageKeys.forEach((storageKey) => {
          if (!storageKey) {
            console.warn('Invalid storageKey:', storageKey);
            return;
          }
          const metadata = moonriverAssets.find(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, '') === storageKey);
          const symbol = metadata && typeof metadata[1] === 'object' && 'symbol' in metadata[1] && metadata[1]['symbol'] ? hexToString(metadata[1]['symbol'].toString()) : null;
          const decimals = metadata && typeof metadata[1] === 'object' && 'decimals' in metadata[1] && metadata[1]['decimals'] ? metadata[1]['decimals'].toString() : null;
          if (!Number.isNaN(storageKey) && symbol) {
            assetRegistry[symbol] = [storageKey, Number(decimals)];
          } else {
            console.warn('Invalid assetId or symbol:', { storageKey, symbol });
          }
        });
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

    case NetworkEnum.SHIDEN: {
      if (api.query.assets && 'metadata' in api.query.assets) {
        try {
          const registryMap = await api.query.assets.metadata.entries();
          const storageKeys = registryMap.map(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, ''));
          storageKeys.forEach((storageKey) => {
            if (!storageKey) {
              console.warn('Invalid storageKey:', storageKey);
              return;
            }

            const metadata = registryMap.find(([key]) => key.args.map((arg) => arg.toHuman())[0]?.toString().replace(/,/g, '') === storageKey);
            const symbol = metadata && typeof metadata[1] === 'object' && 'symbol' in metadata[1] && metadata[1]['symbol'] ? hexToString(metadata[1]['symbol'].toString()) : null;
            const decimals = metadata && typeof metadata[1] === 'object' && 'decimals' in metadata[1] && metadata[1]['decimals'] ? metadata[1]['decimals'].toString() : null;
            if (symbol) {
              assetRegistry[symbol] = [storageKey, Number(decimals)];
            }
          });
        } catch (error) {
          console.error('Error retrieving entries from SHIDEN network:', error);
        }
      }
      break;
    }

    case NetworkEnum.TURING: {
      if (api.query.assetRegistry && 'metadata' in api.query.assetRegistry) {
        try {
          const registryMap = await (api.query.assetRegistry.metadata as any).entries();
          for (const [key, value] of registryMap) {
            const storageKey = key.toHuman()[0];
            const metadata = value.toHuman() as unknown as { symbol: string, decimals: string; };
            if (!metadata) {
              console.warn('Invalid metadata:', metadata);
              continue;
            }
            const symbol = metadata.symbol;
            const decimals = metadata.decimals;
            if (symbol && !Number.isNaN(decimals)) {
              assetRegistry[symbol] = [storageKey, Number(decimals)];
            } else {
              console.warn('Invalid symbol or decimals:', { symbol, decimals });
            }
          }
        } catch (error) {
          console.error('Error retrieving entries from KARURA network:', error);
        }
      }
      break;
    }

    // NetworkEnum.TINKERNET
    default: {
      assetRegistry[AssetEnum.TNKR] = [FeeAsset.Native, RingAssets.TNKR.decimals];
      assetRegistry[AssetEnum.KSM] = [FeeAsset.Relay, RingAssets.KSM.decimals];
      break;
    }
  }

  return assetRegistry;
}

export async function getBalancesFromNetwork(api: ApiPromise, address: string, network: NetworkEnum): Promise<ResultBalancesWithNetwork> {
  const balancesByNetwork: ResultBalances = {};

  switch (network) {
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
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.BASILISK, api);
          for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
            const tokens = await api.query.tokens.accounts(address, assetId as number);
            const freeTokens = tokens.free.toString();
            const reservedTokens = tokens.reserved.toString();
            const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();
            if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
              continue;
            }
            balancesByNetwork[assetSymbol] = {
              freeBalance: freeTokens,
              reservedBalance: reservedTokens,
              totalBalance: totalTokens,
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
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.BIFROST, api);
          for (const [symbol, decimals] of Object.entries(assetRegistry)) {
            const tokens = await api.query.tokens.accounts.entries(address);
            tokens.forEach(([storageKey, balances]) => {
              const tokenSymbol = Object.values(storageKey.args.map((k) => k.toJSON())[1])[0];
              if (symbol === tokenSymbol) {
                const balance = balances.toJSON() as unknown as { free: string; };
                const freeBalance = new BigNumber(balance.free.replace(/,/g, "")).toString();
                const decimalFormat = typeof decimals === 'string' ? parseInt(decimals, 10) : typeof decimals === 'object' ? decimals[1] : decimals;
                if (new BigNumber(freeBalance).isZero() || new BigNumber(freeBalance).isNaN()) {
                  return;
                }
                balancesByNetwork[symbol] = {
                  decimals: decimalFormat,
                  freeBalance,
                  reservedBalance: "0",
                  totalBalance: freeBalance,
                };
                return;
              }
            });
          }
        }
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

        // query tokens
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.KARURA, api);
          for (const [symbol, decimals] of Object.entries(assetRegistry)) {
            const tokens = await api.query.tokens.accounts.entries(address);
            const decimalFormat = typeof decimals === 'string' ? parseInt(decimals, 10) : typeof decimals === 'object' ? decimals[1] : decimals;
            tokens.forEach(([storageKey, balances]) => {
              const tokenSymbol = Object.values(storageKey.args.map((k) => k.toJSON())[1])[0];
              if (symbol === tokenSymbol) {
                const balance = balances.toHuman() as unknown as { free: string; reserved: string; frozen: string; };
                const frozenBalance = new BigNumber(balance.frozen.replace(/,/g, "")).toString();
                const freeBalance = new BigNumber(balance.free.replace(/,/g, "")).minus(frozenBalance).toString();
                const reservedBalance = new BigNumber(balance.reserved.replace(/,/g, "")).toString() || '0';
                const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
                if (new BigNumber(freeBalance).isZero() || new BigNumber(freeBalance).isNaN()) {
                  return;
                }
                balancesByNetwork[symbol] = {
                  decimals: decimalFormat,
                  freeBalance,
                  reservedBalance,
                  totalBalance,
                };
              }
            });
          }
        }
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
        balancesByNetwork[AssetEnum.PHA] = {
          freeBalance,
          reservedBalance,
          totalBalance,
          locks,
        };

        // query tokens
        if (api.query.assets.account) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.KHALA, api);
          for (const [symbol, assetInfo] of Object.entries(assetRegistry)) {
            if (typeof assetInfo === 'object') {
              const assetId = assetInfo[0];
              const decimals = assetInfo[1];
              const tokens = await api.query.assets.account(assetId, address);
              const balances = tokens.toJSON() as unknown as { balance: string, status: string; };
              if (!balances) continue;
              const freeTokens = balances.balance;
              if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
                continue;
              }
              balancesByNetwork[symbol] = {
                freeBalance: freeTokens,
                reservedBalance: '0',
                totalBalance: freeTokens,
                decimals,
              };
            }
          }
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

    case NetworkEnum.MOONRIVER: {
      if (api) {
        // query balances
        const balances = await api.query.system.account(address);
        const freeBalance = balances.data.free.toString();
        const reservedBalance = balances.data.reserved.toString();
        // Moonriver has a frozen balance that we need to account for
        const frozenBalance = (balances.data as any).frozen.toString() || '0';
        const totalNonTransferable = new BigNumber(reservedBalance).plus(new BigNumber(frozenBalance)).toString();
        const totalTransferable = new BigNumber(freeBalance).minus(totalNonTransferable).toString();
        // const locks = await api.query.balances.locks(address);
        balancesByNetwork[AssetEnum.MOVR] = {
          freeBalance: totalTransferable,
          reservedBalance: totalNonTransferable,
          totalBalance: new BigNumber(totalTransferable).minus(new BigNumber(totalNonTransferable)).toString(),
          // locks,
        };

        // query tokens
        if (api.query.assets.account) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.MOONRIVER, api);
          for (const [symbol, assetInfo] of Object.entries(assetRegistry)) {
            if (typeof assetInfo === 'object') {
              const assetId = assetInfo[0];
              const decimals = assetInfo[1];
              const tokens = await api.query.assets.account(assetId, address);
              const balanceFromJson = tokens.toJSON() as unknown as { balance: string, status: string; };
              if (!balanceFromJson) continue;
              const freeTokens = balanceFromJson.balance;
              if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
                continue;
              }
              balancesByNetwork[symbol] = {
                freeBalance: freeTokens,
                reservedBalance: '0',
                totalBalance: freeTokens,
                decimals,
              };
            }
          }
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
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.PICASSO, api);
          for (const [assetSymbol, assetId] of Object.entries(assetRegistry)) {
            const tokens = await api.query.tokens.accounts(address, assetId as number);
            const freeTokens = tokens.free.toString();
            const reservedTokens = tokens.reserved.toString();
            const totalTokens = new BigNumber(freeTokens).plus(new BigNumber(reservedTokens)).toString();
            if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
              continue;
            }
            balancesByNetwork[assetSymbol] = {
              freeBalance: freeTokens,
              reservedBalance: reservedTokens,
              totalBalance: totalTokens,
            };
          }
        }
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

        // query tokens
        if (api.query.assets.account) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.SHIDEN, api);
          for (const [symbol, assetInfo] of Object.entries(assetRegistry)) {
            if (typeof assetInfo === 'object') {
              const assetId = assetInfo[0];
              const decimals = assetInfo[1];
              const tokens = await api.query.assets.account(assetId, address);
              const balances = tokens.toJSON() as unknown as { balance: string, status: string; };
              if (!balances) continue;
              const freeTokens = balances.balance;
              if (new BigNumber(freeTokens).isZero() || new BigNumber(freeTokens).isNaN()) {
                continue;
              }
              balancesByNetwork[symbol] = {
                freeBalance: freeTokens,
                reservedBalance: '0',
                totalBalance: freeTokens,
                decimals,
              };
            }
          }
        }
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

        // query tokens
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.TURING, api);
          for (const [symbol, assetInfo] of Object.entries(assetRegistry)) {
            if (typeof assetInfo === 'object') {
              const assetId = assetInfo[0];
              const decimals = assetInfo[1];
              const tokens = await api.query.tokens.accounts(address, assetId);
              const decimalFormat = typeof decimals === 'string' ? parseInt(decimals, 10) : typeof decimals === 'object' ? decimals[1] : decimals;
              const frozenBalance = new BigNumber(tokens.frozen.toString());
              const freeBalance = new BigNumber(tokens.free.toString()).minus(frozenBalance).toString();
              const reservedBalance = new BigNumber(tokens.reserved.toString()).toString() || '0';
              const totalBalance = new BigNumber(freeBalance).plus(new BigNumber(reservedBalance)).toString();
              if (new BigNumber(freeBalance).isZero() || new BigNumber(freeBalance).isNaN()) {
                continue;
              }
              balancesByNetwork[symbol] = {
                decimals: decimalFormat,
                freeBalance,
                reservedBalance,
                totalBalance,
              };
            }
          }
        }
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
        if (api.query.tokens) {
          const assetRegistry = await getAssetRegistryByNetwork(NetworkEnum.TINKERNET, api);
          if (assetRegistry) {
            for (const [assetSymbol, assetInfo] of Object.entries(assetRegistry)) {
              if (typeof assetInfo === 'object') {
                const assetId = assetInfo[0];
                const decimals = assetInfo[1];
                const tokens = await api.query.tokens.accounts(address, assetId);
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
                    decimals
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
  // console.log(`Balances for ${ network } network:`, balancesByNetwork);
  return ({ [network]: balancesByNetwork });
}

export async function getBalancesFromAllNetworks(address: string): Promise<NetworkBalances> {
  const apis = await createApis();
  const userAddress = address; // Substitute a string address to test Assets page
  const isEthereumAddr = isEthereumAddress(userAddress);
  const promises = Object.entries(Rings).map(async ([network, networkData]) => {
    if (isEthereumAddr && (network === NetworkEnum.MOONRIVER)) {
      // If EVM address, only fetch balances from Moonriver (add more EVM networks later)
      const api = apis[network as NetworkEnum];
      return getBalancesFromNetwork(api, userAddress, network as NetworkEnum);
    } else if (!isEthereumAddr) {
      const api = apis[network as NetworkEnum];
      return getBalancesFromNetwork(api, userAddress, network as NetworkEnum);
    }
    return Promise.resolve({ [network]: {} });
  });
  const results: ResultBalancesWithNetwork[] = await Promise.all(promises);
  const allBalances: NetworkBalances = Object.assign({}, ...results);

  return allBalances;
}