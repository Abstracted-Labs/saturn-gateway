import type { Account, BaseWallet, BaseWalletProvider, WalletMetadata } from '@polkadot-onboard/core';
import type { SessionTypes } from '@walletconnect/types';
import type { PolkadotNamespaceChainId, WalletConnectConfiguration, WcAccount } from '@polkadot-onboard/wallet-connect';

import { WalletType } from '@polkadot-onboard/core';
import SignClient from '@walletconnect/sign-client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import type { HexString } from '@polkadot/util/types';
import type { Signer, SignerResult } from '@polkadot/types/types';
import type { SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';

import { TypeRegistry } from '@polkadot/types';

export const POLKADOT_CHAIN_ID = 'polkadot:91b171bb158e2d3848fa23a9f1c25182';
export const WC_VERSION = '2.0';

const toWalletAccount = (wcAccount: WcAccount) => {
	const address = wcAccount.split(':')[2];
	return { address };
};

class CustomWalletConnectWallet implements BaseWallet {
	type = WalletType.WALLET_CONNECT;
	appName: string;
	metadata: WalletMetadata;
	config: WalletConnectConfiguration;
	client: SignClient | undefined;
	signer: Signer | undefined;
	session: SessionTypes.Struct | undefined;
	chainId: PolkadotNamespaceChainId;

	constructor(config: WalletConnectConfiguration, appName: string, chainId?: PolkadotNamespaceChainId) {
		this.config = config;
		this.appName = appName;
		this.metadata = {
			id: 'wallet-connect',
			title: config.metadata?.name || 'Wallet Connect',
			description: config.metadata?.description || '',
			urls: { main: config.metadata?.url || '' },
			iconUrl: config.metadata?.icons[0] || '',
			version: WC_VERSION,
		};
		this.chainId = chainId || POLKADOT_CHAIN_ID;
	}

	reset(): void {
		this.client = undefined;
		this.session = undefined;
		this.signer = undefined;
	}

	async getAccounts(): Promise<Account[]> {
		let accounts: Account[] = [];
		if (this.session) {
			const wcAccounts = Object.values(this.session.namespaces)
				.map(namespace => namespace.accounts)
				.flat();
			accounts = wcAccounts.map(wcAccount => toWalletAccount(wcAccount as WcAccount));
		}

		return accounts;
	}

	async connect() {
		// Reset the client
		this.reset();

		// Init the client
		const client = await SignClient.init(this.config);
		const params = {
			requiredNamespaces: {
				polkadot: {
					methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
					chains: [this.chainId],
					events: [],
				},
			},
		};

		const { uri, approval } = await client.connect(params);
		return new Promise<void>((resolve, reject) => {
			// Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
			if (uri) {
				QRCodeModal.open(uri, () => {
					reject(new Error('Canceled pairing. QR Code Modal closed.'));
				});
			}

			// Await session approval from the wallet.
			approval()
				.then(session => {
					// Setup the client
					this.client = client;
					this.session = session;
					this.signer = new CustomWalletConnectSigner(client, session, this.chainId);
					resolve();
				})
				.catch(reject)
				.finally(() => {
					QRCodeModal.close();
				});
		});
	}

	async disconnect() {
		if (this.session?.topic) {
			this.client?.disconnect({
				topic: this.session?.topic,
				reason: {
					code: -1,
					message: 'Disconnected by client!',
				},
			});
		}

		this.reset();
	}

	isConnected() {
		return Boolean(this.client && this.signer && this.session);
	}
}

export class CustomWalletConnectProvider implements BaseWalletProvider {
	config: WalletConnectConfiguration;
	appName: string;
	chainId?: PolkadotNamespaceChainId;

	constructor(config: WalletConnectConfiguration, appName: string, chainId?: PolkadotNamespaceChainId) {
		this.config = config;
		this.appName = appName;
		this.chainId = chainId;
	}

	getWallets(): BaseWallet[] {
		return [new CustomWalletConnectWallet(this.config, this.appName, this.chainId)];
	}
}

type Signature = {
	signature: HexString;
};

export class CustomWalletConnectSigner implements Signer {
	registry: TypeRegistry;
	client: SignClient;
	session: SessionTypes.Struct;
	chainId: PolkadotNamespaceChainId;
	id = 0;

	constructor(client: SignClient, session: SessionTypes.Struct, chainId: PolkadotNamespaceChainId) {
		this.client = client;
		this.session = session;
		this.registry = new TypeRegistry();
		this.chainId = chainId;
	}

	// This method is set this way to be bound to this class.
	signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
		const request = {
			topic: this.session.topic,
			chainId: this.chainId,
			request: {
				id: 1,
				jsonrpc: '2.0',
				method: 'polkadot_signTransaction',
				params: { address: payload.address, transactionPayload: payload },
			},
		};
		const { signature } = await this.client.request<Signature>(request);
		return { id: ++this.id, signature };
	};

	// This method is set this way to be bound to this class.
	// It might be used outside of the object context to sign messages.
	// ref: https://polkadot.js.org/docs/extension/cookbook#sign-a-message
	signRaw = async (raw: SignerPayloadRaw): Promise<SignerResult> => {
		const request = {
			topic: this.session.topic,
			chainId: this.chainId,
			request: {
				id: 1,
				jsonrpc: '2.0',
				method: 'polkadot_signMessage',
				params: { address: raw.address, message: raw.data },
			},
		};
		const { signature } = await this.client.request<Signature>(request);
		return { id: ++this.id, signature };
	};
}
