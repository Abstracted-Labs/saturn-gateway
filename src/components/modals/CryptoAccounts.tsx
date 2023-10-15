import { For, onMount, createMemo, createSignal, Show, createEffect, onCleanup, on } from "solid-js";
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
import { walletAggregator } from "../../App";
import { BaseWallet, Account } from "@polkadot-onboard/core";
import SignClient from "@walletconnect/sign-client";
// import QRCode from 'qrcode';

const CryptoAccounts = () => {
  let modal: ModalInterface;
  // const [canvasReady, setCanvasReady] = createSignal(false);
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<Account[] & { title?: string; }>([]);
  const [browsingWcList, setBrowsingWcList] = createSignal(false);
  const [qrCodeUri, setQrCodeUri] = createSignal<string>('');
  const saContext = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const walletContext = useWalletConnectContext();
  const theme = useThemeContext();
  const nav = useNavigate();

  const $modalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);

  const isWcAccountMatch = createMemo(() => {
    const wcAccountFromStorage = saContext.setters.getSelectedStorage();
    return !saContext.state.wallet && wcAccountFromStorage.wallet === 'wallet-connect';
  });

  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');

  function isActiveAccount(account: Account) {
    const selectedAccount = saContext.state.account;
    return selectedAccount ? account.address === selectedAccount.address : false;
  }

  async function getAllAccounts() {
    try {
      if (!availableWallets() || !Array.isArray(availableWallets())) {
        throw new Error('availableWallets is not an array');
      }

      // filter Sporran titled entries from wallets
      const filteredWallets = availableWallets().filter((w) => w.metadata.title !== 'Sporran');
      for (const wallet of filteredWallets) {
        if (!wallet || typeof wallet.getAccounts !== 'function') {
          throw new Error('wallet is not valid or getAccounts is not a function');
        }

        if (wallet.type !== "WALLET_CONNECT") {
          try {
            // Connect to each substrate wallet and add accounts to availableAccounts
            await wallet.connect();
          } catch (error) {
            console.error('connect error: ', error);
            continue;
          }
        } else {
          // TODO: FiX bug where WalletConnect requires a qr pairing
          // whenever the app is refreshed. This creates a new session
          // but it prevents the user from connecting to the dApp ("network issues")
        }

        try {
          // Include the wallet title in the accounts array to display in UI
          let accounts: Account[] & { title?: string; } = await wallet.getAccounts();
          accounts = accounts.map((account) => ({ title: wallet.metadata.title, ...account }));

          // Accounts should only be an array of unique addresses despite wallet type
          // accounts = accounts.filter((account, index, self) => self.findIndex((a) => a.address === account.address) === index);

          // Merge updated accounts into all available accounts
          setAvailableAccounts([...availableAccounts(), ...accounts]);
        } catch (error) {
          console.error('getAccounts error: ', error);
          continue;
        }
      }
    } catch (error) {
      console.error('error: ', error);
    } finally {
      console.log('connectedAccounts: ', availableAccounts());
    }
  }

  async function connectUserAccount(acc: Account) {
    if (acc) {
      // Finesse selectedAccount to have BaseWallet properties
      await saContext.setters.setSelected(acc, availableWallets().find((w) => {
        return w.metadata.title === (acc as any).title;
      }));

      if (location.pathname === '/') {
        // Redirect to multisig members page if on home page
        saturnContext.state.multisigId ? nav(`/${ saturnContext.state.multisigId }/members`, { resolve: false }) :
          nav(`/create`, { resolve: false });
      }

      removeModal();
    }
  }

  async function connectWalletConnect() { // Connect to WalletConnect
    const wcWallet = availableWallets().find((w) => w.type === "WALLET_CONNECT");
    await wcWallet?.connect();
    const accounts = await wcWallet?.getAccounts();
    const selectedAccount = accounts?.[0];
    const selectedWcId = selectedAccount?.address;
    if (selectedWcId) {
      // Store WalletConnect session in saturn context
      await saContext.setters.setSelected(selectedAccount, wcWallet);

      // Finesse selectedAccount to have BaseWallet properties
      (selectedAccount as any).title = 'wallet-connect';
      (selectedAccount as any).type = "sr25519";
      (selectedAccount as any).name = wcWallet?.metadata.title;

      // Also add WalletConnect account to availableAccounts
      setAvailableAccounts([...availableAccounts(), selectedAccount]);
      console.log('added WalletConnect to availableAccounts: ', availableAccounts());

      // Redirect to multisig members page if on home page
      if (location.pathname === '/') {
        saturnContext.state.multisigId ? nav(`/${ saturnContext.state.multisigId }/members`, { resolve: false }) :
          nav(`/create`, { resolve: false });
      }

      removeModal();
    }
  }

  function handleOpenWalletConnect() {
    if (isWcAccountMatch()) {
      setBrowsingWcList(true);
    } else {
      connectWalletConnect();
    }
  }

  function removeModal() {
    if (modal) {
      modal.hide();
      setBrowsingWcList(false);
    }
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
      removeModal();
    }
  };

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });

  createEffect(() => {
    let timeout: any;
    timeout = setTimeout(async () => {
      const allWallets = walletAggregator.getWallets();
      setAvailableWallets(allWallets as BaseWallet[]);
      getAllAccounts();
    }, 1000);

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
          <Show when={browsingWcList()}>
            hello!
          </Show>
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
          <Show when={!browsingWcList()}>
            <div class={`mx-4 ${ availableAccounts().length > 2 ? 'h-[500px]' : 'h-auto' }`}>
              <div class={`saturn-scrollbar h-full pr-5 overflow-y-scroll pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
                <Show when={availableAccounts().length > 2}>
                  <For each={availableAccounts()}>
                    {account => {
                      return (
                        <div class={`${ !isActiveAccount(account) ? '' : 'dark:border-saturn-green' } dark:bg-gray-800 bg-gray-200 rounded-lg p-4 mb-2 border-[1.5px] border-gray-200 dark:border-gray-800 hover:border-saturn-purple dark:hover:border-saturn-purple hover:cursor-pointer`} onClick={[connectUserAccount, account]}>
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