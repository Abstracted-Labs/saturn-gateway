import { Account, WalletType } from "@polkadot-onboard/core";
import WalletConnectIcon from "../../assets/icons/walletconnect-logo.svg";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";

const WalletConnectButton = (props: { onClick?: () => any; }) => {
  const [isMatch, setIsMatch] = createSignal(false);
  const saContext = useSelectedAccountContext();

  createEffect(() => {
    const isWcAccountMatch = () => {
      const wcAccount = saContext.setters.getSelectedStorage();
      return !saContext.state.wallet && wcAccount && wcAccount.wallet === 'wallet-connect';
    };

    if (isWcAccountMatch()) {
      setIsMatch(true);
    } else {
      setIsMatch(false);
    }
  });

  return (
    <button type="button" class={`${ isMatch() ? 'border-[1.5px] wc-active border-saturn-green' : 'border-saturn-purple' } dark:bg-saturn-purple bg-saturn-purple rounded-md p-4 hover:bg-purple-800 dark:hover:bg-purple-800 focus:outline-none`} onClick={props.onClick}>
      <img src={WalletConnectIcon} alt="wallet-connect-icon" width={135} height={22} />
    </button>
  );
};

WalletConnectButton.displayName = "WalletConnectButton";
export default WalletConnectButton;