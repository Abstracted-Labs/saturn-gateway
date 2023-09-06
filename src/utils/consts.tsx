import BasiliskIcon from '../assets/icons/basilisk-icon.svg';
import TinkernetIcon from '../assets/icons/tinkernet-icon.svg';
import PicassoIcon from '../assets/icons/picasso-icon.svg';
import KusamaIcon from '../assets/icons/kusama-icon.svg';
import PolkadotIcon from '../assets/icons/polkadot-icon-25x25.png';
import { JSXElement } from 'solid-js';
import { getNetworkBlock } from './getNetworkBlock';

export const BUTTON_COMMON_STYLE = 'rounded-lg border-2 border-saturn-purple bg-gray-200 dark:bg-saturn-darkgrey active:border-saturn-purple visited:border-saturn-purple flex flex-row items-center';

export const INPUT_COMMON_STYLE = "text-sm text-saturn-darkgrey dark:text-saturn-offwhite";

export enum WalletTypeEnum {
  SUBWALLET = "sub", // ?
  TALISMAN = "talisman",
  NOVAWALLET = "nova",
  PJS = "polkadot-js", // ?
  CRUSTWALLET = "crust wallet"
}

export enum NetworkEnum {
  TINKERNET = "tinkernet",
  BASILISK = "basilisk",
  PICASSO = "picasso",
  KUSAMA = "kusama",
  POLKADOT = "polkadot",
}

// export const WSS_TINKERNET = 'wss://invarch-tinkernet.api.onfinality.io/public-ws';
export const WSS_TINKERNET = 'wss://brainstorm.invarch.network/rococo';

export const AssetIconByCurrency: Record<string, string> = {
  TNKR: TinkernetIcon,
  BSX: BasiliskIcon,
  PICA: PicassoIcon,
  KSM: KusamaIcon,
  DOT: PolkadotIcon,
};

export const NetworkIconByCurrency: Record<string, string[]> = {
  TNKR: [TinkernetIcon, BasiliskIcon],
  BSX: [BasiliskIcon],
  PICA: [PicassoIcon],
  KSM: [TinkernetIcon, BasiliskIcon, PicassoIcon],
  DOT: [PolkadotIcon],
};