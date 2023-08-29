import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { BUTTON_COMMON_STYLE } from "../../utils/consts";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import WalletLabel from "./WalletLabel";
import AvatarAndName from "../legos/AvatarAndName";
import NetworkBalance from "../top-nav/NetworkBalance";
import CopyAddressField from "../legos/CopyAddressField";
import { removeAccountsModal } from "../../utils/removeAccountsModal";

const ConnectWallet = () => {
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const selectedAccount = useSelectedAccountContext();
  const isLoggedIn = createMemo(() => !!selectedAccount.setters.getSelectedStorage());
  // const isLoggedIn = createMemo(() => !!selectedAccount.state.account && !!storageMemo());

  function openDropdown() {
    setIsDropdownActive(!isDropdownActive());
    const $dropdown = document.getElementById('dropdownWallet');
    if ($dropdown?.classList.contains('hidden')) {
      $dropdown?.classList.remove('hidden');
      $dropdown?.classList.add('flex');
      $dropdown?.style.setProperty('transform', 'translate3d(0px, 33px, 0px)');
    }
  }

  function openModal() {
    const $modal = document.getElementById('accounts-modal');
    const $backdrop = document.querySelector('[modal-backdrop]');
    $modal?.classList.remove('hidden');
    $backdrop?.classList.remove('hidden');
    $modal?.style.setProperty('transform', 'translate3d(0px, 0px, 0px)');
  }

  createEffect(() => {
    console.log('storageMemo', isLoggedIn());
  });

  return <div class="relative flex flex-col w-60">
    <button
      onClick={openDropdown}
      data-dropdown-offset-distance="-6"
      id="dropdownWallet"
      data-dropdown-toggle="walletToggle"
      class={`${ BUTTON_COMMON_STYLE } text-sm text-saturn-black dark:text-saturn-offwhite h-full justify-between pl-4 w-full z-30 focus:outline-none self-stretch`}
      type="button">
      <AvatarAndName enlarge={false} name={selectedAccount.state.account?.name} avatar={(selectedAccount.state.account as any)?.avatar} />
      <svg data-accordion-icon class={`transition-all w-3 h-3 ${ isDropdownActive() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-4`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
      </svg>
    </button>
    <div id="walletToggle" class={`${ BUTTON_COMMON_STYLE } hidden rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none py-1.5 z-50 flex flex-col w-full`} aria-labelledby="dropdownWallet">
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
      <div class="mx-4 my-3">
        <button type="button" onClick={openModal} data-modal-target="accounts-modal" data-modal-toggle="accounts-modal" class="bg-saturn-purple dark:hover:bg-purple-800 hover:bg-purple-900 text-white text-sm rounded-lg py-1.5 px-11 focus:outline-none">{selectedAccount.state.account ? 'Change Account' : 'Connect Wallet'}</button>
      </div>
    </div>
  </div>;
};

ConnectWallet.displayName = 'ConnectWallet';
export default ConnectWallet;