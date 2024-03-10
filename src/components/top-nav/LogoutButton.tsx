import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import LogoutIcon from "../../assets/icons/logout-icon-15x15.svg";
import { Show, createMemo } from "solid-js";
import { WALLET_ACCOUNTS_MODAL_ID } from "./ConnectWallet";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PROPOSE_MODAL_ID } from "../modals/ProposeModal";
import { useNavigate } from "@solidjs/router";

interface ILogoutButtonProps {
  onClick: () => any;
  cancel?: boolean | undefined;
  proposeModal?: boolean | undefined;
}

const LogoutButton = (props: ILogoutButtonProps) => {
  const selectedAccount = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const nav = useNavigate();

  const accountState = createMemo(() => selectedAccount.state);
  const accountSetter = createMemo(() => selectedAccount.setters);
  const saturnSetter = createMemo(() => saturnContext.setters);

  const onLogout = (e: Event) => {
    e.preventDefault();
    console.log("Attempting to logout", accountState());

    try {
      console.log("Disconnecting wallet", accountState().wallet);
      accountState().wallet?.disconnect();
      console.log("Clearing selected account");
      accountSetter().clearSelected();
      console.log("Logging out from saturn context");
      saturnSetter().logout();
      console.log("Triggering onClick prop");
      props.onClick();
      console.log("Redirecting to home page");
      nav('/');
    } catch {
      console.error("Error disconnecting wallet");
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