import { BaseWallet, Account } from "@polkadot-onboard/core";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { decodeAddress, isAddress } from "@polkadot/util-crypto";
import { useParams } from "@solidjs/router";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { Component, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { Rings } from "../../data/rings";
import { useProposeContext, ProposalType, Proposal } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { useWalletConnectContext } from "../../providers/walletConnectProvider";
import { setupSaturnConnect, setSaturnConnectAccount } from "../../utils/setupSaturnConnect";
import IdentityCardModal from "../modals/identityCard";
import ProposeModal from "../modals/propose";
import defaultMultisigImage from '../../assets/images/default-multisig-image.png';
import { Core } from '@walletconnect/core';
import type { SessionTypes } from '@walletconnect/types';
import styles from '../../App.module.css';
import MainContent from "./MainContent";

const MainContainer = () => {
  const [wcUriInput, setWcUriInput] = createSignal<string>('');
  const [wcModalOpen, setWcModalOpen] = createSignal<boolean>(false);
  const [walletModalOpen, setWalletModalOpen] = createSignal<boolean>(false);
  const [wcActiveSessions, setWcActiveSessions] = createSignal<
    Array<[string, SessionTypes.Struct]>
  >([]);
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
              display: { Raw: string; };
              image: { Raw: string; };
              twitter: { Raw: string; };
              web: { Raw: string; };
            };
          }
        )?.info;

        const name = iden?.display?.Raw ? iden.display.Raw : `Multisig ${ mid }`;
        const imageUrl = iden?.image?.Raw
          ? iden.image.Raw
          : multisigIdentity().imageUrl;
        const twitterUrl = iden?.twitter?.Raw
          ? `https://twitter.com/${ iden.twitter.Raw }`
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
              accounts: [`polkadot:d42e9606a995dfe433dc7955dc2a70f4:${ address }`],
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
      };

      wcContext.setters.setWalletConnect(w3w, sessionProposalCallback, sessionRequestCallback);
    };

    runAsync();
  });

  createEffect(() => {
    const tinkernetApi = ringApisContext.state.tinkernet;
    const sat = saturnContext.state.saturn;

    if (!tinkernetApi || !sat) return;

    const runAsync = async () => {
      if (isAddress(idOrAddress)) {
        const id = (await tinkernetApi.query.inv4.coreByAccount(idOrAddress))
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
    };

    runAsync();
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

  return (
    <div class="m-2">
      <MainContent />
      <Portal>
        <ProposeModal />
        <IdentityCardModal />
      </Portal>
      {/* <div class={styles.leftPanel}>
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
            class='gap-1 bg-green-500 hover:bg-saturn-red'
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
                      onInput={(e: any) => {
                        setWcUriInput(e.currentTarget.value);
                      }}
                    />
                    <Button
                      class='bg-green-500 hover:bg-saturn-red'
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
                    class='bg-green-500 hover:bg-saturn-red'
                    onClick={() => setWcModalOpen(false)}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Portal>
        </div>
      </div> */}
      <div class={styles.rightPanel}>
        {/* <div class={styles.topContainer}>
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
              class='gap-1 rounded-tr-3xl self-start bg-green-500 hover:bg-saturn-red'
            >
              {selectedAccountContext.state.account?.name || 'Log In'}
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
                        when={availableAccounts()?.accounts[0]}
                        fallback={
                          <For each={availableWallets()}>
                            {wallet => (
                              <Button
                                class='gap-1 bg-green-500 hover:bg-saturn-red capitalize'
                                onClick={() => connectUserWallet(wallet)}
                              >
                                {wallet.type === "WALLET_CONNECT" ? "Wallet Connect" : wallet.metadata.title}
                              </Button>
                            )}
                          </For>
                        }
                      >
                        <For each={availableAccounts()?.accounts}>
                          {acc => (
                            <Button
                              class='bg-green-500 hover:bg-saturn-red'
                              onClick={() => connectUserAccount(acc, availableAccounts()?.wallet)}
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
                      class='bg-green-500 hover:bg-saturn-red'
                      onClick={() => setWalletModalOpen(false)}
                    >
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Portal>
          </div>
        </div> */}
      </div>
    </div>
  );
};

MainContainer.displayName = 'MainContainer';
export default MainContainer;
