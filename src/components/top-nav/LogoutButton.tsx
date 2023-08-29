import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import LogoutIcon from "../../assets/icons/logout-icon-15x15.svg";
import { Show, createMemo } from "solid-js";
import { removeAccountsModal } from "../../utils/removeAccountsModal";

const LogoutButton = (props: { onClick: () => any; }) => {
  const selectedAccount = useSelectedAccountContext();

  async function onLogout(e: Event, account: any) {
    e.preventDefault();

    try {
      if (account.state.wallet && account.state.wallet.disconnect) {
        await account.state.wallet.disconnect();
        await account.setters.clearSelected();
        props.onClick();
      }
    } catch (error) {
      console.error(error);
    }
  }

  return <>
    <Show when={!!selectedAccount.state.account}>
      <button type="button" data-modal-target="accounts-modal" data-modal-toggle="accounts-modal" onClick={(e) => onLogout(e, selectedAccount)} class="p-4 bg-transparent text-sm rounded-md dark:hover:bg-gray-900 hover:bg-gray-200 focus:outline-none text-saturn-lightgrey flex gap-2 items-center flex-row"><span>Logout</span> <img src={LogoutIcon} alt="logout" /></button>
    </Show>
  </>;
};

LogoutButton.displayName = 'LogoutButton';
export default LogoutButton;