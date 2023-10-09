import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, lazy, on, onCleanup, onMount } from 'solid-js';
import { Routes, Route, useNavigate } from '@solidjs/router';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Saturn } from '@invarch/saturn-sdk';
import {
  WalletAggregator,
} from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { WalletConnectProvider as WCProvider, type WalletConnectConfiguration } from '@polkadot-onboard/wallet-connect';
import { Rings } from './data/rings';
import { Proposal, ProposalType, ProposeProvider, useProposeContext } from "./providers/proposeProvider";
import { WalletConnectProvider, useWalletConnectContext } from "./providers/walletConnectProvider";
import { useRingApisContext, RingApisProvider } from "./providers/ringApisProvider";
import { useSaturnContext, SaturnProvider } from "./providers/saturnProvider";
import { useSelectedAccountContext, SelectedAccountProvider } from "./providers/selectedAccountProvider";
import { IdentityProvider } from "./providers/identityProvider";
import Layout from './components/legos/Layout';
import { ThemeProvider } from './providers/themeProvider';
import MainContainer from './components/center-main/MainContainer';
import Home from './pages/Home';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { setupSaturnConnect } from './utils/setupSaturnConnect';
import { WC_PROJECT_ID } from './utils/consts';

const Create = lazy(async () => import('./pages/Create'));

const createApis = async (): Promise<Record<string, ApiPromise>> => {
  const entries: Array<Promise<[string, ApiPromise]>> = Object.entries(Rings).map(
    async ([chain, data]) => {
      const res: [string, ApiPromise] = [
        chain,
        await ApiPromise.create({
          provider: new WsProvider(data.websocket),
        }),
      ];

      return res;
    },
  );

  return Object.fromEntries(await Promise.all(entries));
};

export const walletConnectParams: WalletConnectConfiguration = {
  projectId: WC_PROJECT_ID,
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'Saturn Gateway',
    description: 'Saturn Gateway',
    url: 'https://invarch.network',
    icons: [
      'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
    ],
  },
  chainIds: ["polkadot:d42e9606a995dfe433dc7955dc2a70f4"],
};

export const walletAggregator = new WalletAggregator([
  new InjectedWalletProvider({}, 'Saturn UI'),
  new WCProvider(walletConnectParams, "Saturn Gateway"),
]);

const HomePlanet: Component = () => {
  const [core, setCore] = createSignal<any>();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const proposeContext = useProposeContext();
  const wcContext = useWalletConnectContext();
  const navigate = useNavigate();
  const saturnStateMemo = createMemo(() => saturnContext.state);
  const getW3W = createMemo(() => wcContext.state.w3w);
  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);
  const isHomepage = createMemo(() => location.pathname === '/');
  const getDefaultMultisigId = createMemo(() => {
    // return undefined if no multisigs
    if (!saturnContext.state.multisigItems || saturnContext.state.multisigItems.length === 0) {
      return undefined;
    }

    const defaultMultisigId = saturnContext.state.multisigItems[0].id;
    return defaultMultisigId;
  });

  onMount(async () => {
    // Get all available accounts
    const current = selectedAccountContext.setters.getSelectedStorage();

    if (current) {
      const { address, wallet } = current;
      const w = walletAggregator.getWallets().find((w) => w.metadata.title == wallet);

      if (w) {
        await w.connect();

        const a = (await w.getAccounts()).find((a) => a.address == address);

        if (a) {
          selectedAccountContext.setters.setSelected(a, w);
        }
      }
    }

    const apis = await createApis();

    if (apis.tinkernet) {
      ringApisContext.setters.setRingApisBatch(apis);

      const sat = new Saturn({ api: apis.tinkernet });
      saturnContext.setters.setSaturn(sat);
    }
  });

  createEffect(() => {
    // Set Wallet Connect Core which includes Saturn's projectId
    const core = new Core({
      projectId: WC_PROJECT_ID,
    });
    setCore(core);
  });

  createEffect(() => {
    // Init contexts for Saturn Connect
    setupSaturnConnect(saturnContext, proposeContext);
  });

  createEffect(() => {
    // Set session proposal and request callbacks for Wallet Connect
    let timeout: any;
    const runAsync = async () => {
      try {
        if (!core()) return;
        const w3w = await Web3Wallet.init({
          core: core(),
          metadata: {
            name: 'Saturn',
            description: 'Saturn Multisig',
            url: 'https://invarch.network',
            icons: [
              'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
            ],
          },
        });

        const sessionProposalCallback = async (proposal: any) => {
          console.log('session_proposal: ', proposal);
          const address = saturnStateMemo().multisigAddress;
          if (address) {
            await w3w.approveSession({
              id: proposal.id,
              namespaces: {
                polkadot: {
                  accounts: [`polkadot:d42e9606a995dfe433dc7955dc2a70f4:${ address }`],
                  methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
                  chains: ['polkadot:d42e9606a995dfe433dc7955dc2a70f4'],
                  events: [],
                },
              },
            });
          }
        };

        const sessionRequestCallback = async (event: any) => {
          console.log('session_request: ', event);
          const address = saturnStateMemo().multisigAddress;
          if (!address) return;

          const { topic, params, id } = event;
          const { request } = params;
          const requestedTx = request.params;
          const chainId = params.chainId;

          if (
            u8aToHex(decodeAddress(requestedTx.address))
            != u8aToHex(decodeAddress(address))
          ) {
            console.log('accounts don\'t match');
            console.log(requestedTx.address, address);
            console.log(
              u8aToHex(decodeAddress(requestedTx.address)),
              u8aToHex(decodeAddress(address)),
            );
          } else {
            const chain = Object.entries(Rings).find(([_, value]) => value.wcNamespace == chainId)?.[0];

            console.log("chain: ", chain);

            if (!chain) return;

            const proposalType = chain === "tinkernet" ? ProposalType.LocalCall : ProposalType.XcmCall;

            proposeContext.setters.openProposeModal(
              new Proposal(proposalType, { chain, encodedCall: hexToU8a(requestedTx.transactionPayload.method) })
            );

            const response = {
              id,
              error: { code: 42069, message: 'Proposed to multisig.' },
              jsonrpc: '2.0',
            };

            if (topic && response) {
              await w3w.respondSessionRequest({ topic, response });
            }
          }
        };

        timeout = setTimeout(() => {
          if (wcContext.setters.setWalletConnect && !!w3w) {
            wcContext.setters.setWalletConnect(w3w, sessionProposalCallback, sessionRequestCallback);
          }
        }, 100);
      } catch (error) {
        console.error(error);
      }
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  createEffect(() => {
    // Set QR code for Wallet Connect
    let timeout: any;
    const runAsync = async () => {
      try {
        const w3w = getW3W();
        if (!w3w) return;
        if (typeof w3w.core.pairing.create === 'function') {
          timeout = setTimeout(async () => {
            const paired = await w3w.core.pairing.create();
            if (paired) {
              wcContext.setters.setSaturnQr(paired.uri);
              console.log('wc qr: ', wcContext.state.saturnQr);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error creating WalletConnect pairing:', error);
      }
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  createEffect(() => {
    // if logged in and on homepage, redirect to multisig members page
    if (isLoggedIn()) {
      if (!!getDefaultMultisigId() && isHomepage()) {
        navigate(`/${ getDefaultMultisigId() }/members`, { resolve: false });
        return;
      }
    }
  });

  return (
    <Layout>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/create" component={Create} />
        <Route path='/:idOrAddress/*' component={MainContainer} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <ProposeProvider>
    <SaturnProvider>
      <RingApisProvider>
        <WalletConnectProvider>
          <SelectedAccountProvider>
            <IdentityProvider>
              <ThemeProvider>
                <HomePlanet />
              </ThemeProvider>
            </IdentityProvider>
          </SelectedAccountProvider>
        </WalletConnectProvider>
      </RingApisProvider>
    </SaturnProvider>
  </ProposeProvider>
);

export default App;
