import BasiliskIcon from '../assets/icons/basilisk-icon.svg';
import TinkernetIcon from '../assets/icons/tinkernet-icon.svg';
import PicassoIcon from '../assets/icons/picasso-icon.svg';
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
  tinkernet: RingsData;
  basilisk: RingsData;
  picasso: RingsData;
};

export const Rings: RingsType = {
  tinkernet: {
    wcNamespace: 'polkadot:d42e9606a995dfe433dc7955dc2a70f4',
    polkaholicId: 'invArch',
    decimals: 12,
    icon: TinkernetIcon,
    websocket: WSS_TINKERNET,
    genesisHash: "0xd42e9606a995dfe433dc7955dc2a70f495f350f373daa200098ae84437816ad2",
  },
  basilisk: {
    wcNamespace: 'polkadot:a85cfb9b9fd4d622a5b28289a02347af',
    polkaholicId: 'basilisk',
    decimals: 12,
    icon: BasiliskIcon,
    websocket: 'wss://basilisk-rpc.dwellir.com',
    genesisHash: "0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755",
  },
  picasso: {
    wcNamespace: 'polkadot:6811a339673c9daa897944dcdac99c6e',
    polkaholicId: 'picasso',
    decimals: 12,
    icon: PicassoIcon,
    websocket: 'wss://rpc.composablenodes.tech',
    genesisHash: "0x6811a339673c9daa897944dcdac99c6e2939cc88245ed21951a0a3c9a2be75bc",
  },
};

export enum AssetEnum {
  TNKR = 'TNKR',
  BSX = 'BSX',
  PICA = 'PICA',
  KSM = 'KSM',
  DOT = 'DOT',
}

export type NetworksByAssetType = Record<AssetEnum, NetworkEnum[]>;

export const NetworksByAsset: NetworksByAssetType = {
  TNKR: [NetworkEnum.KUSAMA, NetworkEnum.TINKERNET, NetworkEnum.BASILISK],
  BSX: [NetworkEnum.KUSAMA, NetworkEnum.BASILISK],
  PICA: [NetworkEnum.KUSAMA, NetworkEnum.PICASSO],
  KSM: [NetworkEnum.KUSAMA, NetworkEnum.TINKERNET, NetworkEnum.BASILISK, NetworkEnum.PICASSO],
  DOT: [NetworkEnum.POLKADOT],
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
