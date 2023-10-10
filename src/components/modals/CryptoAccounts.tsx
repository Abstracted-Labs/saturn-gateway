import { Account, BaseWallet } from "@polkadot-onboard/core";
import { For, onMount, createMemo, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { walletAggregator } from "../../App";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import WalletLabel from "../top-nav/WalletLabel";
import CopyAddressField from "../legos/CopyAddressField";
import { useThemeContext } from "../../providers/themeProvider";
import NetworkBalance from "../top-nav/NetworkBalance";
import AvatarAndName from "../legos/AvatarAndName";
import WalletConnectButton from "../top-nav/WalletConnectButton";
import LogoutButton from "../top-nav/LogoutButton";
import { WALLET_ACCOUNTS_MODAL_ID } from "../top-nav/ConnectWallet";
import { Modal, initModals } from 'flowbite';
import type { ModalInterface } from 'flowbite';
import { useNavigate } from "@solidjs/router";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useWalletConnectContext } from "../../providers/walletConnectProvider";
import QRCode from 'qrcode';

const CryptoAccounts = () => {
  let modal: ModalInterface;
  const [canvasReady, setCanvasReady] = createSignal(false);
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<Account[] & { title?: string; }>([]);
  const [openWalletConnect, setOpenWalletConnect] = createSignal(false);
  const [qrCodeUri, setQrCodeUri] = createSignal<string>('');
  // const [wcActiveSessions, setWcActiveSessions] = createSignal<
  //   Array<[string, SessionTypes.Struct]>
  // >([]);
  const selectedAccountContext = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const walletContext = useWalletConnectContext();
  const theme = useThemeContext();
  const nav = useNavigate();
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const $modalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);

  async function getAllAccounts() {
    try {
      if (!availableWallets() || !Array.isArray(availableWallets())) {
        throw new Error('availableWallets is not an array');
      }

      for (const wallet of availableWallets()) {
        if (!wallet || typeof wallet.getAccounts !== 'function') {
          throw new Error('wallet is not valid or getAccounts is not a function');
        }

        // Connect to each wallet
        if (wallet.type !== 'WALLET_CONNECT') {
          await wallet.connect();
        }

        // Include the wallet title in the accounts array
        let accounts: Account[] & { title?: string; } = await wallet.getAccounts();
        accounts = accounts.map((account) => ({ title: wallet.metadata.title, ...account }));

        // Accounts should only be an array of unique addresses despite wallet type
        accounts = accounts.filter((account, index, self) => self.findIndex((a) => a.address === account.address) === index);

        // Merge all available accounts
        setAvailableAccounts([...availableAccounts(), ...accounts]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function connectUserAccount(acc: Account) {
    if (acc) {
      await selectedAccountContext.setters.setSelected(acc, availableWallets().find((w) => {
        return w.metadata.title === (acc as any).title;
      }));

      if (location.pathname === '/') {
        saturnContext.state.multisigId ? nav(`/${ saturnContext.state.multisigId }/members`, { resolve: false }) :
          nav(`/create`, { resolve: false });
      }

      removeModal();
    }
  }

  async function connectWalletConnect() {
    // get wc web3wallet from availableWallets()
    const wcWallet = availableWallets().find((w) => w.type === 'WALLET_CONNECT');
    await wcWallet?.connect();
    const accounts = await wcWallet?.getAccounts();
    const selectedAccount = accounts?.[0];
    const selectedWcId = selectedAccount?.address; // TODO: handle multiple accounts
    if (selectedWcId) {
      await selectedAccountContext.setters.setSelected(selectedAccount, wcWallet);

      if (location.pathname === '/') {
        saturnContext.state.multisigId ? nav(`/${ saturnContext.state.multisigId }/members`, { resolve: false }) :
          nav(`/create`, { resolve: false });
      }

      removeModal();
    }
  }

  function handleOpenWalletConnect() {
    // setOpenWalletConnect(true);
    connectWalletConnect();
  }

  function removeModal() {
    if (modal) {
      modal.hide();
    }
    setOpenWalletConnect(false);
  }

  async function tryWcConnectDapp() {
    const uri = qrCodeUri();

    console.log('qrCodeUri: ', uri);

    if (walletContext.state.w3w) {
      await walletContext.state.w3w.core.pairing.pair({ uri });
    }
  }

  async function disconnectWeb3Wallet(topic: string) {
    if (walletContext.state.w3w) {
      await walletContext.state.w3w.disconnectSession({
        topic,
        reason: { code: 123, message: '' },
      });

      console.log('session disconnected');

      // setWcActiveSessions(Object.entries(walletContext.state.w3w.getActiveSessions()));

      removeModal();
    }
  };

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });

  onMount(() => {
    setAvailableWallets(walletAggregator.getWallets());
    getAllAccounts();
  });

  onMount(() => {
    setCanvasReady(true);
  });

  createEffect(() => {
    const uri = walletContext.state.saturnQr;
    if (uri) {
      setQrCodeUri(uri);
    }
  });

  createEffect(() => {
    let timeout: any;
    if (!canvasReady()) return;
    if (!openWalletConnect()) return;

    const runAsync = async () => {
      const canvas = document.getElementById('qr-code-canvas');
      const text = qrCodeUri();
      try {
        if (canvas !== null) {
          timeout = setTimeout(async () => {
            await QRCode.toCanvas(canvas, text);
          }, 100);
        } else {
          console.error('Error generating QR code: canvas is null');
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  return (
    <>
      <div id={WALLET_ACCOUNTS_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
        <div id="modalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1" />
        <div class={`relative h-auto px-4 bg-saturn-offwhite dark:bg-black rounded-md`}>
          <div class="flex flex-row items-start justify-between p-4">
            <h4 class="text-md font-semibold text-gray-900 dark:text-white">
              Connect Wallet
            </h4>
            <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={removeModal}>
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          {/* <Show when={openWalletConnect()}>
            <div class="mx-4">
              <input
                class="text-black"
                value={qrCodeUri()}
                onInput={(e: any) => {
                  setQrCodeUri(e.currentTarget.value);
                }}
              />
              <Show when={canvasReady()} fallback={<span class="text-black dark:text-white text-xxs align-center">Loading QR Code...</span>}>
                <div class="bg-saturn-purple dark:bg-saturn-purple p-5 rounded-md">
                  <canvas class="rounded-md mb-3" id="qr-code-canvas"></canvas>
                  <CopyAddressField address={qrCodeUri()} length={10} />
                </div>
              </Show>
              <button
                class='bg-green-500 hover:bg-saturn-red'
                onClick={() => tryWcConnectDapp()}
              >
                Connect to dApp
              </button>
            </div>
            <div class="flex flex-row justify-end gap-2 items-center m-6">
              <LogoutButton cancel={true} onClick={removeModal} />
            </div>
          </Show> */}
          <Show when={!openWalletConnect()}>
            <div class={`mx-4 ${ availableAccounts().length > 2 ? 'h-[500px]' : 'h-auto' }`}>
              <div class={`saturn-scrollbar h-full pr-5 overflow-y-scroll pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
                <Show when={availableAccounts().length > 2}>
                  <For each={availableAccounts()}>
                    {account => {
                      return (
                        <div class="dark:bg-gray-800 bg-gray-200 rounded-lg p-4 mb-2 border-[1px] border-gray-200 dark:border-gray-800 hover:border-saturn-purple dark:hover:border-saturn-purple hover:cursor-pointer" onClick={[connectUserAccount, account]}>
                          <AvatarAndName name={account.name} avatar={(account as any).avatar} enlarge={true} />
                          <div class="flex flex-row justify-between items-start my-3
                    ">
                            <WalletLabel walletType={(account as any).title} />
                            <div class="xxs:text-xxs sm:text-xs"><NetworkBalance address={account.address} /></div>
                          </div>
                          <CopyAddressField address={account.address} length={18} />
                        </div>
                      );
                    }}
                  </For>
                </Show>
              </div>
            </div>
            <div class="flex flex-row justify-end gap-2 items-center m-6">
              <LogoutButton onClick={removeModal} />
              <WalletConnectButton onClick={handleOpenWalletConnect} />
            </div>
          </Show>
        </div>
      </div>
    </>
  );
};

CryptoAccounts.displayName = 'CryptoAccounts';
export default CryptoAccounts;