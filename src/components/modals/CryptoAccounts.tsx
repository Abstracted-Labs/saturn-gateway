import { Account, BaseWallet } from "@polkadot-onboard/core";
import { For, onMount, createMemo, createSignal, createEffect, onCleanup, } from "solid-js";
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
import type { ModalOptions, ModalInterface } from 'flowbite';

const CryptoAccounts = () => {
  let modal: ModalInterface;
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<Account[] & { title?: string; }>([]);
  const selectedAccountContext = useSelectedAccountContext();
  const theme = useThemeContext();
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

        if (wallet.type === 'WALLET_CONNECT') {
          // We handle Wallet Connect differently elsewhere
          continue;
        }

        // Connect to each wallet
        await wallet.connect();

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

      removeModal();
    }
  }

  function removeModal() {
    if (modal) {
      modal.hide();
    }
  }

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });

  onMount(() => {
    setAvailableWallets(walletAggregator.getWallets());
    getAllAccounts();
  });

  // createEffect(() => {
  //   // This effect is for closing the modal when clicking outside of it
  //   const handleClickOutside = (event: any) => {
  //     const instance = document.getElementById(WALLET_ACCOUNTS_MODAL_ID);
  //     console.log('click outside Event', event);
  //     if (event && instance && !instance.contains(event.target)) {
  //       removeModal();
  //     }
  //   };

  //   if (modal.isVisible()) {
  //     document.addEventListener('click', handleClickOutside);
  //   }

  //   onCleanup(() => {
  //     document.removeEventListener('click', handleClickOutside);
  //   });
  // });

  return (
    <div id={WALLET_ACCOUNTS_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-[500px] mx-auto p-4 overflow-x-hidden mt-10 overflow-y-auto z-[60]">
      <div class="relative h-[660px] bg-saturn-offwhite dark:bg-black rounded-md">
        <div class="flex items-start justify-between p-4">
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
        <div class="mx-6 h-[500px]">
          {/* <div class="relative mx-auto flex-row flex justify-center items-center w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-3">
            <img src={Keyhole} alt="Login to continue" class="opacity-75" />
            <img src={WalletIcon} alt="purple-wallet-icon" class="absolute bottom-[4px] right-[8px]" />
          </div>
          <p class="text-sm font-normal text-saturn-black dark:text-saturn-offwhite my-5">Connect Wallet to Continue</p> */}
          <div class={`saturn-scrollbar h-full pr-5 overflow-y-scroll pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
            <For each={availableAccounts()}>
              {account => {
                return (
                  <div class="dark:bg-gray-800 bg-gray-200 rounded-lg p-4 mb-2 border-[1px] border-gray-200 dark:border-gray-800 hover:border-saturn-purple dark:hover:border-saturn-purple hover:cursor-pointer" onClick={[connectUserAccount, account]}>
                    <AvatarAndName name={account.name} avatar={(account as any).avatar} enlarge={true} />
                    <div class="flex flex-row justify-between items-start my-3
                    ">
                      <WalletLabel walletType={(account as any).title} />
                      <div class="text-xs"><NetworkBalance address={account.address} /></div>
                    </div>
                    <CopyAddressField address={account.address} length={18} />
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <div class="flex flex-row justify-end gap-2 items-center m-6">
          <LogoutButton onClick={removeModal} />
          <WalletConnectButton onClick={() => null} />
        </div>
      </div>
    </div>
  );
};

CryptoAccounts.displayName = 'CryptoAccounts';
export default CryptoAccounts;