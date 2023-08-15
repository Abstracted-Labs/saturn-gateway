import { Rings } from '../data/rings';

const PolkaholicStartUrl = "https://api.polkaholic.io/account/realtime/";

const AllChainsUrl = Object.values(Rings).map((r) => r.polkaholicId).reduce((prev, pId) => { return `${prev}${pId},` }, "?chainfilters=");

export type AssetsBalances = Record<string, Balances>;

export type Balances = {
    freeBalance: string;
    reservedBalance: string;
    frozenBalance: string;
};

export type ResultBalancesWithNetwork = Record<string, AssetsBalances>;

export type NetworkBalances = {
    [Property in keyof typeof Rings]: AssetsBalances;
};

export async function getBalancesFromAllNetworks(address: string): Promise<NetworkBalances> {
    return fetch(
        PolkaholicStartUrl + address + AllChainsUrl + "&decrate=f",
    ).then(async response => response.json().then(res => {
        const newRes = (res as { state: { free_raw?: string, reserved_raw?: string, frozen_raw?: string, id: string, symbol: string } }[]);

        const balances: NetworkBalances = newRes
            .map((asset) => {
                return {
                    [asset.state.id as keyof typeof Rings]: {
                        [asset.state.symbol]: {
                            freeBalance: asset.state.free_raw || "0",
                            reservedBalance: asset.state.reserved_raw || "0",
                            frozenBalance: asset.state.frozen_raw || "0",
                        }
                    }
                } as NetworkBalances
            })
            .reduce((prev: NetworkBalances, asset) => {
                let newPrev = prev;
                let assets = prev[Object.keys(asset)[0] as keyof typeof Rings] || {};

                assets[Object.keys(Object.values(asset)[0])[0]] = Object.values(Object.values(asset)[0])[0];

                newPrev[Object.keys(asset)[0] as keyof typeof Rings] = assets;

                return newPrev;
            }, {} as NetworkBalances);

        return balances;
    }
    ));
}
