import basiliskIcon from '../assets/basilisk-icon.png';
import tinkernetIcon from '../assets/tinkernet-icon.jpg';
import picassoIcon from '../assets/picasso-icon.png';

export const SubIdStartUrl = 'https://sub.id/api/v1/';

export type RingsData = {
    wcNamespace: string;
    subIdBalancesUrl: string;
    decimals: number;
    icon: string;
    websocket: string;
    genesisHash: string;
};

export type RingsType = {
    tinkernet: RingsData;
    basilisk: RingsData;
    picasso: RingsData;
};

export const Rings: RingsType = {
    tinkernet: {
        wcNamespace: 'polkadot:d42e9606a995dfe433dc7955dc2a70f4',
        subIdBalancesUrl: '/balances/invArch',
        decimals: 12,
        icon: tinkernetIcon,
        websocket: 'wss://invarch-tinkernet.api.onfinality.io/public-ws',
        // websocket: "ws://localhost:8000",
        genesisHash: "0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2",
    },
    basilisk: {
        wcNamespace: 'polkadot:a85cfb9b9fd4d622a5b28289a02347af',
        subIdBalancesUrl: '/balances/basilisk',
        decimals: 12,
        icon: basiliskIcon,
        websocket: 'wss://rpc.basilisk.cloud',
        genesisHash: "0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755",
    },
    picasso: {
        wcNamespace: 'polkadot:6811a339673c9daa897944dcdac99c6e',
        subIdBalancesUrl: '/balances/picasso',
        decimals: 12,
        icon: picassoIcon,
        websocket: 'wss://rpc.composablenodes.tech',
        genesisHash: "0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc",
    },
};

export type NetworksByAssetType = Record<string, string[]>;

export const NetworksByAsset: NetworksByAssetType = {
    TNKR: ["tinkernet", "basilisk"],
    BSX: ["basilisk"],
    PICA: ["picasso"],
    KSM: ["tinkernet", "basilisk", "picasso"],
};

export const RingAssets = {
    TNKR: {
        decimals: 12,
    },
    BSX: {
        decimals: 12,
    },
    PICA: {
        decimals: 12,
    },
    KSM: {
        decimals: 12,
    },
};
