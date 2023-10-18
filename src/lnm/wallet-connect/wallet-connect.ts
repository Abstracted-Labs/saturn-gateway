import type { Account, KeypairType, WalletMetadata } from '@polkadot-onboard/core';
import type { Signer } from '@polkadot/types/types';
import type { SessionTypes } from '@walletconnect/types';
import type { BaseWallet, WalletConnectConfiguration, WcAccount } from './types';
import { WalletType } from '@polkadot-onboard/core';
import SignClient from '@walletconnect/sign-client';
import { Web3Wallet } from '@walletconnect/web3wallet';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { WalletConnectSigner } from './signer';
import { ExtensionConfiguration, WalletExtension } from '@polkadot-onboard/injected-wallets';
import type { Injected, InjectedWindow, InjectedAccount } from '@polkadot/extension-inject/types';
import { WalletNameEnum } from '../../utils/consts';
import { getSdkError } from '@walletconnect/utils';

export const POLKADOT_CHAIN_ID = 'polkadot:91b171bb158e2d3848fa23a9f1c25182';
export const WC_VERSION = '2.0';

export const toWalletAccount = (wcAccount: WcAccount) => {
  let address = wcAccount.split(':')[2];
  return { address };
};

export class WalletConnectWallet implements BaseWallet {
  type = WalletType.WALLET_CONNECT;
  appName: string;
  metadata: WalletMetadata;
  config: WalletConnectConfiguration;
  client: SignClient | undefined;
  signer: Signer | undefined;
  session: SessionTypes.Struct | undefined;

  constructor(config: WalletConnectConfiguration, appName: string) {
    if (!config.chainIds || config.chainIds.length === 0) config.chainIds = [POLKADOT_CHAIN_ID];
    this.config = config;
    this.appName = appName;
    this.metadata = {
      id: WalletNameEnum.WALLETCONNECT,
      title: config.metadata?.name || 'Wallet Connect',
      description: config.metadata?.description || '',
      urls: { main: config.metadata?.url || '' },
      iconUrl: config.metadata?.icons[0] || '',
      version: WC_VERSION,
    };
  }

  reset(): void {
    this.client = undefined;
    this.session = undefined;
    this.signer = undefined;
  }

  async getAccounts(): Promise<Account[]> {
    let accounts: Account[] = [];
    if (this.session) {
      let wcAccounts = Object.values(this.session.namespaces)
        .map((namespace) => namespace.accounts)
        .flat();
      accounts = wcAccounts.map((wcAccount) => toWalletAccount(wcAccount as WcAccount));
    }
    return accounts;
  }

  async connect() {
    // reset the client
    this.reset();

    // init the client
    let client = await SignClient.init(this.config);
    let params = {
      requiredNamespaces: {
        polkadot: {
          methods: ["polkadot_signTransaction", "polkadot_signMessage"],
          chains: this.config.chainIds,
          events: [],
        },
      },
    };

    const { uri, approval } = await client.connect(params);
    return new Promise<void>((resolve, reject) => {
      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        QRCodeModal.open(uri, () => {
          reject(new Error("Canceled pairing. QR Code Modal closed."));
        });
      }
      // Await session approval from the wallet.
      approval()
        .then((session) => {
          // setup the client
          this.client = client;
          this.session = session;
          this.signer = new WalletConnectSigner(client, session);
          resolve();
        })
        .catch(reject)
        .finally(() => QRCodeModal.close());
    });
  }

  async autoConnect() {
    const client = await SignClient.init(this.config);
    const session = client.session.values[0];
    if (session) {
      const expireDate = new Date(session.expiry * 1000);
      const now = new Date();

      if (now < expireDate && session.acknowledged) {
        this.client = client;
        this.session = session;
        this.signer = new WalletConnectSigner(client, session);
      } else {
        this.client?.disconnect({
          topic: session.topic,
          reason: {
            code: -1,
            message: getSdkError("USER_DISCONNECTED").message,
          },
        });
      }
    }
  }

  async disconnect() {
    if (this.session?.topic) {
      this.client?.disconnect({
        topic: this.session?.topic,
        reason: {
          code: -1,
          message: getSdkError("USER_DISCONNECTED").message,
        },
      });
    }
    this.reset();
  }

  isConnected() {
    return !!(this.client && this.signer && this.session);
  }
}

export class WalletConnectProvider implements BaseWalletProvider {
  config: WalletConnectConfiguration;
  appName: string;

  constructor(config: WalletConnectConfiguration, appName: string) {
    this.config = config;
    this.appName = appName;
  }

  getWallets(): BaseWallet[] {
    return [new WalletConnectWallet(this.config, this.appName)];
  }
}

export interface BaseWalletProvider {
  getWallets: () => BaseWallet[];
}

export class WalletAggregator {
  walletProviders: BaseWalletProvider[];
  constructor(providers: BaseWalletProvider[]) {
    this.walletProviders = providers;
  }
  getWallets(): BaseWallet[] {
    let wallets: BaseWallet[] = [];
    for (let provider of this.walletProviders) {
      wallets.push(...provider.getWallets());
    }
    return wallets;
  }
}

export class InjectedWalletProvider implements BaseWalletProvider {
  config: ExtensionConfiguration;
  supportedOnly: boolean;
  appName: string;
  constructor(config: ExtensionConfiguration, appName: string, supportedOnly: boolean = false) {
    this.config = config;
    this.supportedOnly = supportedOnly;
    this.appName = appName;
  }
  getExtensions(): { known: WalletExtension[]; other: WalletExtension[]; } {
    const injectedWindow = window as Window & InjectedWindow;
    const knownExtensions: WalletExtension[] = [];
    const otherExtensions: WalletExtension[] = [];
    if (injectedWindow.injectedWeb3) {
      Object.keys(injectedWindow.injectedWeb3).forEach((extensionId) => {
        if (!this.config.disallowed?.includes(extensionId)) {
          const foundExtension = this.config.supported?.find(({ id }) => id === extensionId);
          if (foundExtension) {
            knownExtensions.push({ ...injectedWindow.injectedWeb3[extensionId], metadata: foundExtension });
          } else {
            otherExtensions.push({ ...injectedWindow.injectedWeb3[extensionId], metadata: { id: extensionId, title: extensionId } });
          }
        }
      });
    } else {
      console.info('no extension was detected!');
    }

    return { known: knownExtensions, other: otherExtensions };
  }

  getWallets(): BaseWallet[] {
    let injectedWallets: InjectedWallet[] = [];
    let { known, other } = this.getExtensions();
    let extensions = [...known];
    if (!this.supportedOnly) {
      extensions = [...extensions, ...other];
    }
    injectedWallets = extensions.map((ext) => new InjectedWallet(ext, this.appName));
    return injectedWallets;
  }
}

class InjectedWallet implements BaseWallet {
  type = WalletType.INJECTED;
  extension: WalletExtension;
  appName: string;
  injected: Injected | undefined;
  metadata: WalletMetadata;
  signer: Signer | undefined;

  constructor(extension: WalletExtension, appName: string) {
    this.extension = extension;
    this.metadata = { ...extension.metadata };
    this.appName = appName;
  }

  async getAccounts(): Promise<Account[]> {
    let injectedAccounts = await this.injected?.accounts.get();
    let walletAccounts = injectedAccounts?.map((account: InjectedAccount): Account => {
      return {
        address: account.address,
        type: account.type as KeypairType ?? 'sr25519',
        genesisHash: account.genesisHash ?? null,
        name: account.name ?? this.appName,
      };
    });
    return walletAccounts || [];
  }

  async connect() {
    try {
      let injected: Injected | undefined;
      if (this.extension?.connect) {
        injected = await this.extension.connect(this.appName);
      } else if (this.extension?.enable) {
        injected = await this.extension.enable(this.appName);
      } else {
        throw new Error('No connect(..) or enable(...) hook found');
      }

      this.injected = injected;
      this.signer = injected.signer;
    } catch ({ message }: any) {
      console.error(`Error initializing ${ this.metadata.title }: ${ message }`);
    }
  }

  async disconnect() { }
  isConnected() {
    return false;
  }
}

