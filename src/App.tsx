import type { Component } from 'solid-js';
import { lazy, onMount, createSignal, Show, For, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Routes, Route, useParams } from '@solidjs/router';
import { A } from '@solidjs/router';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Saturn, type MultisigDetails, type MultisigCall } from '@invarch/saturn-sdk';
import { isAddress, decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { BN } from '@polkadot/util';
import type Web3WalletType from '@walletconnect/web3wallet';
import { Web3Wallet } from '@walletconnect/web3wallet';
import type { SessionTypes } from '@walletconnect/types';
import { Core } from '@walletconnect/core';
import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Input,
    Table,
    Tbody,
    Tr,
    Td,
} from '@hope-ui/solid';
import {
    WalletAggregator,
    type BaseWallet,
    type Account,
} from '@polkadot-onboard/core';

import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { AiOutlineTwitter, AiOutlineLink } from 'solid-icons/ai';

import { setupSaturnConnect, setSaturnConnectAccount } from "./utils/setupSaturnConnect";
import { CustomWalletConnectProvider } from './utils/wcImplementation';
import logo from './assets/logo.png';
import defaultMultisigImage from './assets/default-multisig-image.png';
import styles from './App.module.css';
import { Rings } from './data/rings';
import { useProposeContext, ProposeProvider, Proposal, ProposalType } from "./providers/proposeProvider";
import { useWalletConnectContext, WalletConnectProvider } from "./providers/walletConnectProvider";
import { useRingApisContext, RingApisProvider } from "./providers/ringApisProvider";
import { useSaturnContext, SaturnProvider } from "./providers/saturnProvider";
import { useSelectedAccountContext, SelectedAccountProvider } from "./providers/selectedAccountProvider";
import { IdentityProvider } from "./providers/identityProvider";

import ProposeModal from './modals/propose';
import IdentityCardModal from './modals/identityCard';

const Assets = lazy(async () => import('./pages/Assets'));
const Queue = lazy(async () => import('./pages/Queue'));
const Members = lazy(async () => import('./pages/Members'));

const pages = [
    "assets",
    "queue",
    "members",
];

const MainPage: Component = () => {
    const [wcUriInput, setWcUriInput] = createSignal<string>('');
    const [wcModalOpen, setWcModalOpen] = createSignal<boolean>(false);
    const [walletModalOpen, setWalletModalOpen] = createSignal<boolean>(false);
    const [wcActiveSessions, setWcActiveSessions] = createSignal<
        Array<[string, SessionTypes.Struct]>
    >([]);
    const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
        [],
    );
    const [availableAccounts, setAvailableAccounts] = createSignal<Account[]>([]);
    const [multisigIdentity, setMultisigIdentity] = createSignal<{
        name: string;
        imageUrl: string;
        twitterUrl?: string;
        websiteUrl?: string;
    }>({
        name: 'Multisig',
        imageUrl: defaultMultisigImage,
        twitterUrl: undefined,
        websiteUrl: undefined,
    });

    const proposeContext = useProposeContext();
    const wcContext = useWalletConnectContext();
    const ringApisContext = useRingApisContext();
    const saturnContext = useSaturnContext();
    const selectedAccountContext = useSelectedAccountContext();

    setupSaturnConnect(saturnContext, proposeContext);

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

    const walletConnectParams = {
        projectId: '04b924c5906edbafa51c651573628e23',
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
            name: 'Saturn UI',
            description: 'Saturn Multisig UI',
            url: 'https://invarch.network',
            icons: [
                'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
            ],
        },
    };
    const walletAggregator = new WalletAggregator([
        new InjectedWalletProvider({}, 'Saturn UI'),
        new CustomWalletConnectProvider(
            walletConnectParams,
            'Saturn UI',
            'polkadot:d42e9606a995dfe433dc7955dc2a70f4',
        ),
    ]);

    setAvailableWallets(walletAggregator.getWallets());

    const params = useParams();

    const tryWcConnectDapp = async () => {
        const uri = wcUriInput();

        console.log('uri: ', uri);

        if (wcContext.state.w3w) {
            await wcContext.state.w3w.core.pairing.pair({ uri });
        }
    };

    const { idOrAddress } = params;

    createEffect(() => {
        const details = saturnContext.state.multisigDetails;
        const ra = ringApisContext.state;
        const mid = saturnContext.state.multisigId;

        if (details && ra?.tinkernet && typeof mid === "number") {
            const acc = details.account;

            const runAsync = async () => {
                const iden = (
                    (await ra.tinkernet.query.identity.identityOf(acc))?.toHuman() as {
                        info: {
                            display: { Raw: string };
                            image: { Raw: string };
                            twitter: { Raw: string };
                            web: { Raw: string };
                        };
                    }
                )?.info;

                const name = iden?.display?.Raw ? iden.display.Raw : `Multisig ${mid}`;
                const imageUrl = iden?.image?.Raw
                    ? iden.image.Raw
                    : multisigIdentity().imageUrl;
                const twitterUrl = iden?.twitter?.Raw
                    ? `https://twitter.com/${iden.twitter.Raw}`
                    : undefined;
                const websiteUrl = iden?.web?.Raw || undefined;

                setMultisigIdentity({ name, imageUrl, twitterUrl, websiteUrl });
            };

            runAsync();
        }
    });

    createEffect(() => {
        const name = multisigIdentity().name;
        const address = saturnContext.state.multisigAddress;

        if (!address || name === "Multisig") return;

        setSaturnConnectAccount(name, address);
    });

    createEffect(() => {
        const address = saturnContext.state.multisigAddress;
        const mid = saturnContext.state.multisigId;
        const sat = saturnContext.state.saturn;

        if (!address || typeof mid !== 'number' || !sat) return;

        const core = new Core({
            projectId: '04b924c5906edbafa51c651573628e23',
        });

        const runAsync = async () => {
            const w3w = await Web3Wallet.init({
                core,
                metadata: {
                    name: 'Saturn',
                    description: 'Saturn Multisig',
                    url: 'https://invarch.network',
                    icons: [
                        'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
                    ],
                },
            });

            setWcActiveSessions(Object.entries(w3w.getActiveSessions()));

            const sessionProposalCallback = async (proposal: any) => {
                console.log('session_proposal: ', proposal);

                await w3w.approveSession({
                    id: proposal.id,
                    namespaces: {
                        polkadot: {
                            accounts: [`polkadot:d42e9606a995dfe433dc7955dc2a70f4:${address}`],
                            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
                            chains: ['polkadot:d42e9606a995dfe433dc7955dc2a70f4'],
                            events: [],
                        },
                    },
                });

                console.log('session approved');

                setWcActiveSessions(Object.entries(w3w.getActiveSessions()));
            };

            const sessionRequestCallback = async (event: any) => {
                console.log('session_request: ', event);

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

                    await w3w.respondSessionRequest({ topic, response });
                }
            }

            wcContext.setters.setWalletConnect(w3w, sessionProposalCallback, sessionRequestCallback);
        };

        runAsync();
    });

    onMount(async () => {
        const apis = await createApis();

        ringApisContext.setters.setRingApisBatch(apis);

        const sat = new Saturn({ api: apis.tinkernet });

        saturnContext.setters.setSaturn(sat);

        if (isAddress(idOrAddress)) {
            const id = (await apis.tinkernet.query.inv4.coreByAccount(idOrAddress))
                .unwrapOr(null)
                ?.toNumber();

            if (typeof id === 'number') {
                saturnContext.setters.setMultisigId(id);

                const maybeDetails = await sat.getDetails(id);

                if (maybeDetails) {
                    saturnContext.setters.setMultisigDetails(maybeDetails);

                    saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
                }
            }
        } else {
            const numberId = parseInt(idOrAddress);

            saturnContext.setters.setMultisigId(numberId);

            const maybeDetails = await sat.getDetails(numberId);

            if (maybeDetails) {
                saturnContext.setters.setMultisigDetails(maybeDetails);

                saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
            }
        }
    });

    const disconnectWcSession = async (topic: string) => {
        if (wcContext.state.w3w) {
            await wcContext.state.w3w.disconnectSession({
                topic,
                reason: { code: 123, message: '' },
            });

            console.log('session disconnected');

            setWcActiveSessions(Object.entries(wcContext.state.w3w.getActiveSessions()));
        }
    };

    const connectUserWallet = async (wallet: BaseWallet) => {
        await wallet.connect();
        setAvailableAccounts(await wallet.getAccounts());
        selectedAccountContext.setters.setSelectedWallet(wallet);
    };

    const connectUserAccount = async (acc: Account) => {
        selectedAccountContext.setters.setSelectedAccount(acc);
        setWalletModalOpen(false);
    };

    return (
        <div class={styles.pageContainer}>
            <Portal>
                <ProposeModal />
                <IdentityCardModal />
            </Portal>
            <div class={styles.leftPanel}>
                <img class={styles.logo} src={logo} />
                <div class={styles.pageListContainer}>
                    <For each={pages}>
                        {(page) => (
                            <A
                                href={page}
                                class={styles.pageItemContainer}
                                activeClass={styles.enabled}
                            >
                                <div class={styles.selectedItemGradient} />
                                <div class={styles.selectedItemIndicator} />
                                {page}
                            </A>
                        )}
                    </For>
                </div>
                <div class='py-2.5'>
                    <Button
                        onClick={() => setWcModalOpen(true)}
                        class='gap-1 bg-[#D55E8A] hover:bg-[#E40C5B]'
                    >
                        <img
                            src='https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/White/Icon.svg'
                            class='max-h-[70%]'
                        />
                        WalletConnect
                    </Button>
                    <Portal>
                    <Modal opened={wcModalOpen()} onClose={() => setWcModalOpen(false)}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalCloseButton />
                            <ModalHeader>WalletConnect Sessions</ModalHeader>
                            <ModalBody>
                                <div>
                                    <Input
                                        value={wcUriInput()}
                                        onInput={e => {
                                            setWcUriInput(e.currentTarget.value);
                                        }}
                                    />
                                    <Button
                                        class='bg-[#D55E8A] hover:bg-[#E40C5B]'
                                        onClick={() => tryWcConnectDapp()}
                                    >
                                        Connect to dApp
                                    </Button>
                                </div>
                                <div>
                                    <Table>
                                        <Tbody>
                                            <For each={wcActiveSessions()}>
                                                {([sessionTopic, sessionData]) => (
                                                    <Tr>
                                                        <Td>
                                                            <div class='flex gap-1'>
                                                                <img
                                                                    class='max-w-[10%] object-cover'
                                                                    src={sessionData.peer.metadata.icons[0]}
                                                                />
                                                                {sessionData.peer.metadata.name}
                                                            </div>
                                                        </Td>

                                                        <Td>
                                                            <Button
                                                                onClick={() =>
                                                                    disconnectWcSession(sessionTopic)
                                                                }
                                                            >
                                                                Disconnect
                                                            </Button>
                                                        </Td>
                                                    </Tr>
                                                )}
                                            </For>
                                        </Tbody>
                                    </Table>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    class='bg-[#D55E8A] hover:bg-[#E40C5B]'
                                    onClick={() => setWcModalOpen(false)}
                                >
                                    Close
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                    </Portal>
                </div>
            </div>
            <div class={styles.rightPanel}>
                <div class={styles.topContainer}>
                    <div class='flex flex-row basis-full items-center space-x-6 pl-4 min-h-[75px] bg-[#222222] border-[#333333] rounded-3xl'>
                        <img
                            class='object-cover w-24 h-24 rounded-md'
                            src={multisigIdentity().imageUrl}
                        />
                        <div class='h-24 flex flex-col'>
                            <p class='font-display mb-1 text-2xl font-semibold text-white'>
                                {multisigIdentity().name}
                            </p>
                            <div class='mb-4 prose prose-sm text-gray-400'>
                                <p>{saturnContext.state.multisigAddress}</p>
                            </div>
                            <div class='flex flex-1 items-end'>
                                <Show when={multisigIdentity().twitterUrl}>
                                    <a
                                        href={multisigIdentity().twitterUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        <AiOutlineTwitter size={20} />
                                    </a>
                                </Show>
                                <Show when={multisigIdentity().websiteUrl}>
                                    <a
                                        href={multisigIdentity().websiteUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        <AiOutlineLink size={20} />
                                    </a>
                                </Show>
                            </div>
                        </div>
                        <div class='grow' />
                        <Button
                            onClick={() => setWalletModalOpen(true)}
                            class='gap-1 rounded-tr-3xl self-start bg-[#D55E8A] hover:bg-[#E40C5B]'
                        >
                            {selectedAccountContext.state.selectedAccount?.name || 'Log In'}
                        </Button>
                        <Portal>
                        <Modal
                            opened={walletModalOpen()}
                            onClose={() => setWalletModalOpen(false)}
                        >
                            <ModalOverlay />
                            <ModalContent>
                                <ModalCloseButton />
                                <ModalHeader>Choose a wallet</ModalHeader>
                                <ModalBody>
                                    <div class='flex flex-col gap-1'>
                                        <Show
                                            when={availableAccounts()[0]}
                                            fallback={
                                                <For each={availableWallets()}>
                                                          {wallet => (
                                                              <Button
                                                                  class='gap-1 bg-[#D55E8A] hover:bg-[#E40C5B]'
                                                                  onClick={() => connectUserWallet(wallet)}
                                                              >
                                                                  <img
                                                                      src={wallet.metadata.iconUrl}
                                                                      class='max-h-[70%]'
                                                                  />
                                                                          {wallet.metadata.title}
                                                              </Button>
                                                          )}
                                                </For>
                                            }
                                        >
                                            <For each={availableAccounts()}>
                                                {acc => (
                                                    <Button
                                                        class='bg-[#D55E8A] hover:bg-[#E40C5B]'
                                                        onClick={() => connectUserAccount(acc)}
                                                    >
                                                        {acc.name}
                                                    </Button>
                                                )}
                                            </For>
                                        </Show>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        class='bg-[#D55E8A] hover:bg-[#E40C5B]'
                                        onClick={() => setWalletModalOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                        </Portal>
                    </div>
                </div>
                <div class={styles.mainContainer}>
                    <div class={styles.mainPanel}>
                        <Routes>
                            <Route
                                path='assets'
                                element={
                                    <Assets />
                                }
                            />
                            <Route
                                path='queue'
                                element={
                                    <Queue />
                                }
                            />
                            <Route
                                path="members"
                                element={<Members />}
                            />
                        </Routes>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: Component = () => (
    <ProposeProvider>
        <SaturnProvider>
            <RingApisProvider>
                <WalletConnectProvider>
                    <SelectedAccountProvider>
                        <IdentityProvider>
                            <Routes>
                                <Route path='/:idOrAddress/*' component={MainPage} />
                            </Routes>
                        </IdentityProvider>
                    </SelectedAccountProvider>
                </WalletConnectProvider>
            </RingApisProvider>
        </SaturnProvider>
    </ProposeProvider>
);

export default App;
