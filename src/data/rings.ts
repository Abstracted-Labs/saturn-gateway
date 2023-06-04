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
	},
	basilisk: {
		wcNamespace: 'polkadot:a85cfb9b9fd4d622a5b28289a02347af',
		subIdBalancesUrl: '/balances/basilisk',
		decimals: 12,
		icon: basiliskIcon,
		websocket: 'wss://rpc.basilisk.cloud',
	},
	picasso: {
		wcNamespace: 'polkadot:6811a339673c9daa897944dcdac99c6e',
		subIdBalancesUrl: '/balances/picasso',
		decimals: 12,
		icon: picassoIcon,
		websocket: 'wss://rpc.composablenodes.tech',
	},
};

export type NetworksByAssetType = Record<string, string[]>;

export const NetworksByAsset: NetworksByAssetType = {
	TNKR: ['tinkernet', 'basilisk'],
	BSX: ['basilisk'],
	PICA: ['picasso'],
};
