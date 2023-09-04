import type { Component } from 'solid-js';
import { lazy, onMount } from 'solid-js';
import { Routes, Route } from '@solidjs/router';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Saturn } from '@invarch/saturn-sdk';
import {
  WalletAggregator,
} from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { WalletConnectProvider as WCProvider, type WalletConnectConfiguration } from '@polkadot-onboard/wallet-connect';
import { Rings } from './data/rings';
import { ProposeProvider } from "./providers/proposeProvider";
import { WalletConnectProvider } from "./providers/walletConnectProvider";
import { useRingApisContext, RingApisProvider } from "./providers/ringApisProvider";
import { useSaturnContext, SaturnProvider } from "./providers/saturnProvider";
import { useSelectedAccountContext, SelectedAccountProvider } from "./providers/selectedAccountProvider";
import { IdentityProvider } from "./providers/identityProvider";
import Layout from './components/legos/Layout';
import { ThemeProvider } from './providers/themeProvider';
import MainContainer from './components/center-main/MainContainer';
import 'flowbite';

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
  projectId: '04b924c5906edbafa51c651573628e23',
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
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();

  onMount(async () => {
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

    ringApisContext.setters.setRingApisBatch(apis);

    const sat = new Saturn({ api: apis.tinkernet });

    saturnContext.setters.setSaturn(sat);
  });

  return (
    <Layout>
      <Routes>
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
