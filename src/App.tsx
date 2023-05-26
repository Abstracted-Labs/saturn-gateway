import type { Component } from 'solid-js';
import { lazy, onMount, createSignal, Show, For } from 'solid-js';
import { Routes, Route, useParams, useSearchParams } from "@solidjs/router";
import { A } from "@solidjs/router";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Saturn, MultisigDetails } from "@invarch/saturn-sdk";
import { isAddress, decodeAddress } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import Web3WalletType, { Web3Wallet } from '@walletconnect/web3wallet';
import type { SessionTypes } from "@walletconnect/types";
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
    TableCaption,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
} from "@hope-ui/solid";
import { WalletAggregator, BaseWalletProvider, BaseWallet, Account } from '@polkadot-onboard/core';
import { InjectedWalletProvider } from '@polkadot-onboard/injected-wallets';
import { CustomWalletConnectProvider } from './utils/wcImplementation';


import logo from './assets/logo.png';
import styles from './App.module.css';
import { Rings } from "./data/rings";

import ProposeModal from "./modals/propose";

const Assets = lazy(() => import("./pages/Assets"));
const Queue = lazy(() => import("./pages/Queue"));

const MainPage: Component = () => {
    const [saturn, setSaturn] = createSignal<Saturn>();
    const [walletConnect, setWalletConnect] = createSignal<Web3WalletType>();
    const [multisigId, setMultisigId] = createSignal<number>();
    const [multisigDetails, setMultisigDetails] = createSignal<MultisigDetails>();
    const [wcUriInput, setWcUriInput] = createSignal<string>("");
    const [wcModalOpen, setWcModalOpen] = createSignal<boolean>(false);
    const [walletModalOpen, setWalletModalOpen] = createSignal<boolean>(false);
    const [wcActiveSessions, setWcActiveSessions] = createSignal<[string, SessionTypes.Struct][]>([]);
    const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>([]);
    const [availableAccounts, setAvailableAccounts] = createSignal<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = createSignal<Account>();
    const [selectedWallet, setSelectedWallet] = createSignal<BaseWallet>();
    const [proposeModalOpen, setProposeModalOpen] = createSignal<boolean>(false);
    const [currentCall, setCurrentCall] = createSignal<Uint8Array>();
    const [ringApis, setRingApis] = createSignal<{[chain: string]: ApiPromise}>();

    const createApis = async (): Promise<{
        [chain: string]: ApiPromise;
    }> => {
        const entries: Promise<[string, ApiPromise]>[] = Object.entries(Rings).map(async ([chain, data]) => {
            const res: [string, ApiPromise] = [chain, await ApiPromise.create({
                provider: new WsProvider(
                    data.websocket
                )
            })];

            return res;
        });

        return Object.fromEntries(await Promise.all(entries));
    }

    const walletConnectParams = {
        projectId: '04b924c5906edbafa51c651573628e23',
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: {
            name: "Saturn UI",
            description: 'Saturn Multisig UI',
            url: "https://invarch.network",
            icons: ["https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png"],
        },
    };
    const walletAggregator = new WalletAggregator([
        new InjectedWalletProvider({}, "Saturn UI"),
        new CustomWalletConnectProvider(walletConnectParams, "Saturn UI", "polkadot:d42e9606a995dfe433dc7955dc2a70f4")
    ]);

    setAvailableWallets(walletAggregator.getWallets());

    const params = useParams();

    console.log("idOrAddress: ", params.idOrAddress);

    const tryWcConnectDapp = async () => {
        const uri = wcUriInput();

        const w3w = walletConnect();

        console.log("uri: ", uri);

        if (w3w) {
            await w3w.core.pairing.pair({ uri })
        }
    };

    const idOrAddress = params.idOrAddress;

    onMount(async () => {

        const apis = await createApis();

        setRingApis(apis);

        const sat = new Saturn({ api: apis["tinkernet"] });

        setSaturn(sat);

        if (isAddress(idOrAddress)) {
            const id = (await apis["tinkernet"].query.inv4.coreByAccount(idOrAddress)).unwrapOr(null)?.toNumber();

            if (typeof id == "number") {
                setMultisigId(id);

                const maybeDetails = await sat.getDetails(id);

                if (maybeDetails) setMultisigDetails(maybeDetails)
            }

        } else {
            const numberId = parseInt(idOrAddress);
            setMultisigId(numberId);

            const maybeDetails = await sat.getDetails(numberId);

            if (maybeDetails) setMultisigDetails(maybeDetails)
        };

        const core = new Core({
            projectId: "04b924c5906edbafa51c651573628e23"
        })

        const w3w = await Web3Wallet.init({
            core,
            metadata: {
                name: "Saturn",
                description: "Saturn Multisig",
                url: "https://invarch.network",
                icons: ["https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png"],
            },
        });

        w3w.on('session_proposal', async proposal => {
            console.log("session_proposal: ", proposal);

            const address = multisigDetails()?.account.toString();

            if (!address) return;

            const session = await w3w.approveSession({
                id: proposal.id,
                namespaces: {
                    polkadot: {
                        accounts: [`polkadot:d42e9606a995dfe433dc7955dc2a70f4:${address}`],
                        methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
                        chains: ["polkadot:d42e9606a995dfe433dc7955dc2a70f4"],
                        events: [],
                    },
                }
            });

            console.log("session approved");

            setWcActiveSessions(Object.entries(w3w.getActiveSessions()));
        });

        w3w.on('session_request', async event => {
            console.log("session_request: ", event);

            const mid = multisigId();
            const mad = multisigDetails()?.account.toString();
            const sa = selectedAccount();
            const sw = selectedWallet();

            if (!mad || typeof mid != "number" || !sat || !sa || !sw?.signer) return;

            console.log("past return")

            const { topic, params, id } = event
            const { request } = params
            const requestedTx = request.params;

            if (u8aToHex(decodeAddress(requestedTx.address)) != u8aToHex(decodeAddress(mad))) {
                console.log("accounts don't match");
                console.log(requestedTx.address, mad);
                console.log(u8aToHex(decodeAddress(requestedTx.address)), u8aToHex(decodeAddress(mad)));
            } else {
                setCurrentCall(requestedTx.transactionPayload.method);
                setProposeModalOpen(true);

                const response = { id, error: { code: 42069, message: "Proposed to multisig." }, jsonrpc: "2.0" };

                await w3w.respondSessionRequest({ topic, response })
            }
        })

        console.log(Object.entries(w3w.getActiveSessions()))

        setWcActiveSessions(Object.entries(w3w.getActiveSessions()));

        setWalletConnect(w3w);
    });

    const disconnectWcSession = async (topic: string) => {
        const w3w = walletConnect();

        if (w3w) {
            await w3w.disconnectSession({ topic, reason: { code: 123, message: "" } });

            console.log("session disconnected");

            setWcActiveSessions(Object.entries(
                w3w.getActiveSessions()
            ));
        }
    }

    const connectUserWallet = async (wallet: BaseWallet) => {
        await wallet.connect();
        setAvailableAccounts(await wallet.getAccounts());
        setSelectedWallet(wallet);
    }

    const connectUserAccount = async (acc: Account) => {
        setSelectedAccount(acc);
        setWalletModalOpen(false);
    }

    return (
        <div class={styles.pageContainer}>
            <ProposeModal
                open={proposeModalOpen()}
                setOpen={setProposeModalOpen}
                saturn={saturn()}
                multisigId={multisigId()}
                account={selectedAccount()}
                signer={selectedWallet()?.signer}
                call={currentCall()}
                ringApis={ringApis()}
            />
            <div class={styles.leftPanel}>
                <img
                    class={styles.logo}
                    src={logo}
                />
                <div class={styles.pageListContainer}>
                    <A
                        href="assets"
                        class={styles.pageItemContainer}
                        activeClass={styles.enabled}
                    >
                        <div class={styles.selectedItemGradient} />
                        <div class={styles.selectedItemIndicator} />
                        Assets
                    </A>

                    <A
                        href="queue"
                        class={styles.pageItemContainer}
                        activeClass={styles.enabled}
                    >
                        <div class={styles.selectedItemGradient} />
                        <div class={styles.selectedItemIndicator} />
                        Queue
                    </A>
                </div>
                <div class="py-2.5">
                    <Button
                        onClick={() => setWcModalOpen(true)}
                        class="gap-1 bg-[#D55E8A] hover:bg-[#E40C5B]"
                    >
                        <img
                            src="https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/White/Icon.svg"
                            class="max-h-[70%]"
                        />

                        WalletConnect
                    </Button>
                    <Modal opened={wcModalOpen()} onClose={() => setWcModalOpen(false)}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalCloseButton />
                            <ModalHeader>WalletConnect Sessions</ModalHeader>
                            <ModalBody>
                                <div>
                                    <Input
                                        value={wcUriInput()}
                                        onInput={(e) => {
                                            setWcUriInput(e.currentTarget.value);
                                        }}
                                    />
                                    <Button class="bg-[#D55E8A] hover:bg-[#E40C5B]" onClick={() => tryWcConnectDapp()}>Connect to dApp</Button>
                                </div>
                                <div>
                                    <Table>
                                        <Tbody>
                                            <For each={wcActiveSessions()}>{([sessionTopic, sessionData]) =>
                                                <Tr>
                                                    <Td>
                                                        <div class="flex gap-1">
                                                            <img class="max-w-[10%] object-cover" src={sessionData.peer.metadata.icons[0]} />
                                                            {sessionData.peer.metadata.name}
                                                        </div>
                                                    </Td>

                                                    <Td><Button onClick={() => disconnectWcSession(sessionTopic)}>Disconnect</Button></Td>
                                                </Tr>
                                            }</For>
                                        </Tbody>
                                    </Table>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button class="bg-[#D55E8A] hover:bg-[#E40C5B]" onClick={() => setWcModalOpen(false)}>Close</Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                </div>
            </div>
            <div class={styles.rightPanel}>
                <div class={styles.topContainer}>
                    <div class="flex flex-row grow-1 basis-full justify-start items-center px-3 p-1.5 min-h-[75px] bg-[#222222] border-[#333333] rounded-3xl">
                        <img
                            class={styles.multisigLogo}
                            src="https://pbs.twimg.com/profile_images/1565785888482811907/83J79V9I_400x400.png"
                        />
                        <div class={styles.multisigNameContainer}>
                            <h3 class={styles.multisigName}>
                                Gabe's Multisig
                            </h3>
                        </div>
                        <div class="grow"></div>
                        <Button
                            onClick={() => setWalletModalOpen(true)}
                            class="gap-1 bg-[#D55E8A] hover:bg-[#E40C5B]"
                        >{selectedAccount()?.name || "Log In"}</Button>
                        <Modal opened={walletModalOpen()} onClose={() => setWalletModalOpen(false)}>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalCloseButton />
                                <ModalHeader>Choose a wallet</ModalHeader>
                                <ModalBody>
                                    <div class="flex flex-col gap-1">
                                        <Show when={availableAccounts()[0]} fallback={
                                            <For each={availableWallets()}>{(wallet) =>
                                                <Button
                                                    class="gap-1 bg-[#D55E8A] hover:bg-[#E40C5B]"
                                                    onClick={() => connectUserWallet(wallet)}
                                                >
                                                    <img
                                                        src={wallet.metadata.iconUrl}
                                                        class="max-h-[70%]"
                                                    />
                                                    {wallet.metadata.title}
                                                </Button>
                                            }</For>
                                        }>
                                            <For each={availableAccounts()}>{(acc) =>
                                                <Button class="bg-[#D55E8A] hover:bg-[#E40C5B]" onClick={() => connectUserAccount(acc)}>
                                                    {acc.name}
                                                </Button>
                                            }</For>
                                        </Show>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button class="bg-[#D55E8A] hover:bg-[#E40C5B]" onClick={() => setWalletModalOpen(false)}>Close</Button>
                                </ModalFooter>
                            </ModalContent>
                        </Modal>
                    </div>
                </div>
                <div class={styles.mainContainer}>
                    <div class={styles.mainPanel}>
                        <Routes>
                            <Route path="assets" element={<Assets
                                                              multisigId={multisigId()}
                                                              address={multisigDetails()?.account.toString()}
                                                              saturn={saturn()}
                                                              ringApis={ringApis()}
                            />} />
                            <Route path="queue" element={<Queue
                                                             multisigId={multisigId()}
                                                             multisigDetails={multisigDetails()}
                                                             address={selectedAccount()?.address}
                                                             saturn={saturn()}
                                                             signer={selectedWallet()?.signer}
                                                             ringApis={ringApis()}
                            />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </div>
    );
};



const App: Component = () => {

    return (
        <Routes>
            <Route path="/:idOrAddress/*" component={MainPage}/>
        </Routes>
    );
}

export default App;
