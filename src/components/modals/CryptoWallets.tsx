import { Account, BaseWallet } from "@polkadot-onboard/core";
import { For, createMemo, createSignal, onMount } from "solid-js";
import { walletAggregator } from "../../App";
import { matchTypeToIcon } from "../../utils/matchTypeToIcon";
import Keyhole from "../../assets/icons/connect-wallet-keyhole.svg";
import { matchTypeToLabel } from "../../utils/matchTypeToLabel";

const CryptoWallets = () => {
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<{ wallet: BaseWallet, accounts: Account[]; }>();

  async function connectUserWallet(wallet: BaseWallet) {
    await wallet.connect();
    setAvailableAccounts({ wallet, accounts: await wallet.getAccounts() });
  };

  onMount(() => {
    setAvailableWallets(walletAggregator.getWallets());
  });

  return <div id="crypto-modal" tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full" style={{ 'z-index': 60 }}>
    <div class="relative max-w-xs max-h-full bg-saturn-offwhite dark:bg-saturn-darkgrey rounded-md">
      <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" data-modal-hide="crypto-modal">
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
        <span class="sr-only">Close modal</span>
      </button>
      <div class="p-6 mt-6">
        <div class="relative mx-auto flex-row flex justify-center items-center w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-3">
          <img src={Keyhole} alt="Login to continue" />
        </div>
        <p class="text-sm font-normal text-saturn-black dark:text-saturn-offwhite my-5">Connect Wallet to Continue</p>
        <div class="flex space-between gap-2 justify-center">
          <For each={availableWallets()}>
            {wallet => {
              const title = wallet.metadata.title;
              return (
                <>
                  {wallet.type !== "WALLET_CONNECT" ? <button
                    type="button"
                    class='gap-1 bg-gray-200 dark:bg-gray-400 capitalize rounded-md p-3 hover:bg-gray-100 dark:hover:bg-gray-300'
                    onClick={() => connectUserWallet(wallet)}
                  >
                    <img width={28} height={28} alt={title} src={matchTypeToIcon(title)} />
                  </button> : null}
                </>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  </div>;
};
CryptoWallets.displayName = 'CryptoWallets';
export default CryptoWallets;