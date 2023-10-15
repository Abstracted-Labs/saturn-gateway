import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BUTTON_COMMON_STYLE } from "../../utils/consts";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import WalletLabel from "./WalletLabel";
import AvatarAndName from "../legos/AvatarAndName";
import NetworkBalance from "../top-nav/NetworkBalance";
import CopyAddressField from "../legos/CopyAddressField";
import { Modal, initModals, Dropdown, initDropdowns } from 'flowbite';
import type { ModalOptions, DropdownOptions, ModalInterface, DropdownInterface } from 'flowbite';

export const WALLET_TOGGLE_ID = 'walletToggle';
export const WALLET_DROPDOWN_ID = 'walletDropdown';
export const WALLET_ACCOUNTS_MODAL_ID = 'walletAccountsModal';

const ConnectWallet = (props: { inMultisig: boolean; }) => {
  let modal: ModalInterface;
  let dropdown: DropdownInterface;
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const selectedAccount = useSelectedAccountContext();
  const isLoggedIn = createMemo(() => !!selectedAccount.state.account?.address);
  const isInMultisig = createMemo(() => props.inMultisig);
  const $modalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);
  const $toggleElement = () => document.getElementById(WALLET_TOGGLE_ID);
  const $dropdownElement = () => document.getElementById(WALLET_DROPDOWN_ID);

  const modalOptions: ModalOptions = {
    backdrop: 'dynamic',
    closable: true,
  };

  const dropdownOptions: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: -7,
    delay: 300,
  };

  const openDropdown = () => {
    if (dropdown) {
      if (!isDropdownActive()) {
        dropdown.show();
        setIsDropdownActive(true);
      } else {
        dropdown.hide();
        setIsDropdownActive(false);
      }
    }
  };

  function openModal() {
    if (modal) {
      if (modal.isHidden()) {
        modal.show();
      }
    }
  }

  onMount(() => {
    initModals();
    if (!$modalElement()) {
      modal = new Modal($modalElement(), modalOptions);
    }

    initDropdowns();
    if (!$dropdownElement()) {
      dropdown = new Dropdown($toggleElement(), $dropdownElement(), dropdownOptions);
    }
  });

  createEffect(() => {
    // This effect is for closing the dropdowns when clicking outside of them
    const handleClickOutside = (event: any) => {
      const dropdownElement = $dropdownElement();
      const toggleElement = $toggleElement();

      if (event && toggleElement && dropdownElement && !toggleElement.contains(event.target) && !dropdownElement.contains(event.target)) {
        if (dropdown) {
          setIsDropdownActive(false);
          dropdown.hide();
        }
      }
    };

    if (isDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  const ConnectButton = () => {
    return <div class={isInMultisig() ? "my-3" : "mx-4 my-3"}>
      <button type="button" onClick={openModal} data-modal-target={WALLET_ACCOUNTS_MODAL_ID} data-modal-show={WALLET_ACCOUNTS_MODAL_ID} class={`bg-saturn-purple dark:hover:bg-purple-800 hover:bg-purple-900 text-white text-sm rounded-lg py-1.5 px-11 focus:outline-none`}>{selectedAccount.state.account ? 'Change Account' : 'Connect Wallet'}</button>
    </div>;
  };

  return <div class="relative">
    <Show when={!isInMultisig()}>
      <button
        onClick={openDropdown}
        data-dropdown-offset-distance="-6"
        id={WALLET_DROPDOWN_ID}
        data-dropdown-toggle={WALLET_TOGGLE_ID}
        class={`${ BUTTON_COMMON_STYLE } text-sm text-saturn-black dark:text-saturn-offwhite h-10 justify-between pl-4 z-30 w-60 flex items-center focus:outline-none`}
        type="button">
        <AvatarAndName enlarge={false} name={selectedAccount.state.account?.name} avatar={(selectedAccount.state.account as any)?.avatar} />
        <svg data-accordion-icon class={`transition-all w-3 h-3 ${ isDropdownActive() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-4`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
        </svg>
      </button>
      <div id={WALLET_TOGGLE_ID} class={`${ BUTTON_COMMON_STYLE } hidden rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none py-1.5 z-50 flex flex-col w-full`} aria-labelledby={WALLET_DROPDOWN_ID}>
        <Show when={isLoggedIn()}>
          <CopyAddressField address={selectedAccount.state.account?.address} length={10} />
          <dl class="mt-4 text-xs w-full px-5">
            <div class="flex flex-row justify-between mb-5 text-saturn-lightgrey">
              <dt>Balance</dt>
              <dd>
                <NetworkBalance address={selectedAccount.state.account?.address} />
              </dd>
            </div>
            <div class="flex flex-row justify-between mb-5 text-saturn-lightgrey">
              <dt>Wallet</dt>
              <dd class="font-bold"><WalletLabel walletType={selectedAccount.state.wallet?.metadata.title} /></dd>
            </div>
          </dl>
        </Show>
        <ConnectButton />
      </div>
    </Show>
    <Show when={isInMultisig()}>
      <ConnectButton />
    </Show>
  </div>;
};

ConnectWallet.displayName = 'ConnectWallet';
export default ConnectWallet;