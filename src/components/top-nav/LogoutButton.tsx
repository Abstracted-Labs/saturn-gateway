import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import LogoutIcon from "../../assets/icons/logout-icon-15x15.svg";
import { Show, createMemo } from "solid-js";
import { WALLET_ACCOUNTS_MODAL_ID } from "./ConnectWallet";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PROPOSE_MODAL_ID } from "../modals/ProposeModal";
import { useLocation, useNavigate } from "@solidjs/router";
import { usePriceContext } from "../../providers/priceProvider";
import { useIdentityContext } from "../../providers/identityProvider";
import { useBalanceContext } from "../../providers/balanceProvider";
import { useToast } from "../../providers/toastProvider";
import { useMegaModal } from "../../providers/megaModalProvider";

interface ILogoutButtonProps {
  onClick?: () => void;
  cancel?: boolean | undefined;
  proposeModal?: boolean | undefined;
}

const LogoutButton = (props: ILogoutButtonProps) => {
  const selectedAccount = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const prices = usePriceContext();
  const identity = useIdentityContext();
  const balances = useBalanceContext();
  const toast = useToast();
  const modal = useMegaModal();

  const onLogout = (e: Event) => {
    toast.addToast("Logging out...", "loading");
    e.preventDefault();

    const accState = selectedAccount.state;
    const accSetter = selectedAccount.setters;
    const satSetter = saturnContext.setters;

    try {
      if (accState.wallet) {
        console.log("Disconnecting wallet...");
        accState.wallet.disconnect();
        console.log("Wallet disconnected.");
      }

      if (accSetter.clearSelected) {
        console.log("Clearing selected account...");
        accSetter.clearSelected();
        console.log("Selected account cleared.");
      }

      if (satSetter.logout) {
        console.log("Logging out from Saturn context...");
        satSetter.logout();
        console.log("Logged out from Saturn context.");
      }

      modal.hideMultisigListModal();
      // modal.hideCryptoAccountsModal(); // TODO: Fix bug causing disconnect issue here

      setTimeout(() => {
        toast.hideToast();
        toast.addToast("Successfully logged out", "success");
      }, 1000);
    } catch {
      console.error("Error disconnecting wallet");
      setTimeout(() => {
        toast.hideToast();
        toast.addToast("Error logging out", "error");
      }, 1000);
    } finally {
      identity.actions.clearIdentities();
      prices.clearPrices();
      balances?.clearBalances();
      window.location.href = "/"; // Redirect to home page as workaround for now
    }
  };

  return <>
    <Show when={!!selectedAccount.state.account && !props.cancel}>
      <button type="button" data-modal-target={WALLET_ACCOUNTS_MODAL_ID} data-modal-toggle={WALLET_ACCOUNTS_MODAL_ID} onClick={(e) => onLogout(e)} class="p-4 bg-transparent text-sm rounded-md dark:hover:bg-gray-900 hover:bg-gray-200 focus:outline-none text-saturn-lightgrey flex gap-2 items-center flex-row"><span>Logout</span> <img src={LogoutIcon} alt="logout" /></button>
    </Show>
    <Show when={props.cancel}>
      <button type="button" data-modal-target={!props.proposeModal ? WALLET_ACCOUNTS_MODAL_ID : PROPOSE_MODAL_ID} data-modal-toggle={!props.proposeModal ? WALLET_ACCOUNTS_MODAL_ID : PROPOSE_MODAL_ID} onClick={props.onClick} class="p-4 bg-transparent text-sm rounded-md dark:hover:bg-gray-900 hover:bg-gray-200 focus:outline-none text-saturn-lightgrey flex gap-2 items-center flex-row"><span>Cancel</span> <img src={LogoutIcon} alt="logout" /></button>
    </Show>
  </>;
};

LogoutButton.displayName = 'LogoutButton';
export default LogoutButton;