import { WalletMetadata, WalletType, Account } from '@polkadot-onboard/core';
import type { Signer } from '@polkadot/types/types';
import { SignClientTypes } from '@walletconnect/types';

export interface BaseWallet {
  metadata: WalletMetadata;
  type: WalletType;
  // signer will be available when the wallet is connected, otherwise it is undefined
  signer: Signer | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getAccounts: () => Promise<Account[]>;
  autoConnect?: () => Promise<void>;
}

export type WcAccount = `${ string }:${ string }:${ string }`;
export type PolkadotNamespaceChainId = `polkadot:${ string }`;
export interface WalletConnectConfiguration extends SignClientTypes.Options {
  chainIds?: PolkadotNamespaceChainId[];
}
