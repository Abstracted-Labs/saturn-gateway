import BasiliskIcon from '../assets/icons/basilisk-icon.svg';
import TinkernetIcon from '../assets/icons/tinkernet-icon.svg';
import PicassoIcon from '../assets/icons/picasso-icon.svg';
import KusamaIcon from '../assets/icons/kusama-icon.svg';
import AssetHubIcon from '../assets/icons/assethub-icon.svg';
import TuringIcon from '../assets/icons/turing-logo.svg';
import MoonriverIcon from '../assets/icons/moonriver-logo.svg';
import KhalaIcon from '../assets/icons/khala-logo.svg';
import BifrostIcon from '../assets/icons/bifrost-logo.svg';
import ShidenIcon from '../assets/icons/shiden-logo.svg';
import KaruraIcon from '../assets/icons/karura-logo.svg';
import { NetworkEnum, WSS_TINKERNET } from '../utils/consts';

export type RingsData = {
  wcNamespace: string;
  polkaholicId: string;
  decimals: number;
  icon: string;
  websocket: string;
  genesisHash: string;
};

export type RingsType = {
  [key in NetworkEnum]?: RingsData;
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
  TUR: {
    decimals: 10,
  },
  MOVR: {
    decimals: 18,
  },
  KAR: {
    decimals: 12,
  },
  PHA: {
    decimals: 12,
  },
  BNC: {
    decimals: 12,
  },
  SDN: {
    decimals: 18,
  },
};

export const Rings: RingsType = {
  [NetworkEnum.TINKERNET]: {
    wcNamespace: 'polkadot:d42e9606a995dfe433dc7955dc2a70f4',
    polkaholicId: 'invArch',
    decimals: RingAssets.TNKR.decimals,
    icon: TinkernetIcon,
    websocket: WSS_TINKERNET,
    genesisHash: "0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2",
  },
  [NetworkEnum.BASILISK]: {
    wcNamespace: 'polkadot:a85cfb9b9fd4d622a5b28289a02347af',
    polkaholicId: 'basilisk',
    decimals: RingAssets.BSX.decimals,
    icon: BasiliskIcon,
    websocket: 'wss://basilisk-rpc.dwellir.com',
    genesisHash: "0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755",
  },
  [NetworkEnum.PICASSO]: {
    wcNamespace: 'polkadot:6811a339673c9daa897944dcdac99c6e',
    polkaholicId: 'picasso',
    decimals: RingAssets.PICA.decimals,
    icon: PicassoIcon,
    websocket: 'wss://rpc.composablenodes.tech',
    genesisHash: "0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc",
  },
  [NetworkEnum.KUSAMA]: {
    wcNamespace: 'polkadot:b0a8d493285c2df73290dfb7e61f870f',
    polkaholicId: 'kusama',
    decimals: RingAssets.KSM.decimals,
    icon: KusamaIcon,
    websocket: 'wss://kusama-rpc.dwellir.com',
    genesisHash: "",
  },
  [NetworkEnum.ASSETHUB]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'statemine',
    decimals: 12,
    icon: AssetHubIcon,
    websocket: 'wss://statemine-rpc.dwellir.com',
    genesisHash: "",
  },
  [NetworkEnum.BIFROST]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'bifrost',
    decimals: RingAssets.BNC.decimals,
    icon: BifrostIcon,
    websocket: 'wss://bifrost-rpc.dwellir.com',
    genesisHash: "",
  },
  [NetworkEnum.SHIDEN]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'shiden',
    decimals: RingAssets.SDN.decimals,
    icon: ShidenIcon,
    websocket: 'wss://shiden-rpc.dwellir.com',
    genesisHash: "",
  },
  [NetworkEnum.KARURA]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'karura',
    decimals: RingAssets.KAR.decimals,
    icon: KaruraIcon,
    websocket: 'wss://karura-rpc-1.aca-api.network',
    genesisHash: "",
  },
  [NetworkEnum.MOONRIVER]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'moonriver',
    decimals: RingAssets.MOVR.decimals,
    icon: MoonriverIcon,
    websocket: 'wss://moonriver-rpc.dwellir.com',
    genesisHash: "",
  },
  [NetworkEnum.TURING]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'turing',
    decimals: RingAssets.TUR.decimals,
    icon: TuringIcon,
    websocket: 'wss://rpc.turing.oak.tech',
    genesisHash: "",
  },
  [NetworkEnum.KHALA]: {
    wcNamespace: 'polkadot:0x',
    polkaholicId: 'khala',
    decimals: RingAssets.PHA.decimals,
    icon: KhalaIcon,
    websocket: 'wss://khala-rpc.dwellir.com',
    genesisHash: "",
  },
};

export enum AssetEnum {
  TNKR = 'TNKR', // Tinkernet
  BSX = 'BSX', // Basilisk
  PICA = 'PICA', // Picasso
  KSM = 'KSM', // Kusama
  // DOT = 'DOT', // Polkadot
  ASSETHUB = 'ASSETHUB', // AssetHub
  BNC = 'BNC', // Bifrost
  PHA = 'PHA', // Khala
  KAR = 'KAR', // Karura
  TUR = 'TUR', // Turing
  MOVR = 'MOVR', // Moonriver
  SDN = 'SDN', // Shiden
}

export enum ExtraAssetEnum {
  ZLK = 'ZLK', // Zenlink
}

export enum AssetHubEnum {
  BILL = 'BILL',
  BAILEGO = 'BAILEGO',
}

export enum AssetHubAssetIdEnum {
  BILL = '223',
  BAILEGO = '88888',
}

export enum ExtraAssetDecimalsEnum {
  BILL = 8,
  BAILEGO = 0,
  ZLK = 18,
}

export type NetworksByAssetType = Record<AssetEnum | AssetHubEnum | ExtraAssetEnum, NetworkEnum[]>;

export const NetworksByAsset: NetworksByAssetType = {
  TNKR: [NetworkEnum.KUSAMA, NetworkEnum.BASILISK, NetworkEnum.TINKERNET],
  BSX: [NetworkEnum.KUSAMA, NetworkEnum.BASILISK],
  PICA: [NetworkEnum.KUSAMA, NetworkEnum.PICASSO],
  KSM: [NetworkEnum.KUSAMA, NetworkEnum.BASILISK, NetworkEnum.TINKERNET, NetworkEnum.PICASSO],
  // DOT: [NetworkEnum.POLKADOT],
  ASSETHUB: [NetworkEnum.ASSETHUB],
  BILL: [NetworkEnum.ASSETHUB],
  BAILEGO: [NetworkEnum.ASSETHUB],
  BNC: [NetworkEnum.BIFROST],
  SDN: [NetworkEnum.SHIDEN],
  KAR: [NetworkEnum.KARURA],
  MOVR: [NetworkEnum.MOONRIVER],
  TUR: [NetworkEnum.TURING],
  PHA: [NetworkEnum.KHALA],

  // Extra tokens
  ZLK: [NetworkEnum.BIFROST],
};