import { Rings } from '../data/rings';

const SUB_ID_START_URL = 'https://sub.id/api/v1/';

export interface BalanceType {
  freeBalance: string;
  reservedBalance: string;
  frozenFee: string;
  totalBalance: string;
  locks: {
    id: string;
    amount: string;
    reasons: string;
  }[];
};

export type ResultBalances = Record<string, BalanceType>;

export type ResultBalancesWithNetwork = Record<string, ResultBalances>;

export type NetworkBalances = {
  [Property in keyof typeof Rings]: ResultBalances;
};

export async function getBalancesFromNetwork(address: string, balancesUrl: string, network: string): Promise<ResultBalancesWithNetwork> {
  return fetch('https://corsproxy.org/?' + encodeURIComponent(SUB_ID_START_URL + address + `/balances/${ balancesUrl }`)).then(async response => response.json().then(res => {
    const balances = (res as ResultBalances);
    // filter out zero balances
    for (const [key, value] of Object.entries(balances)) {
      // console.log(key, value);
      if (value.totalBalance === '0') {
        delete balances[key];
      }
    }

    return ({ [network]: res as ResultBalances });
  }));
}

export async function getBalancesFromAllNetworks(address: string): Promise<NetworkBalances> {
  const promises = [];

  for (const [network, networkData] of Object.entries(Rings)) {
    promises.push(getBalancesFromNetwork(address, networkData.polkaholicId, network));
  }
  const results: ResultBalancesWithNetwork[] = await Promise.all(promises);
  const allBalances: NetworkBalances = Object.assign({}, ...results);

  return allBalances;
}