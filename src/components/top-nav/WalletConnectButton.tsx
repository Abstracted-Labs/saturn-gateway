import WalletConnectIcon from "../../assets/images/walletconnect-logo.svg";
const WalletConnectButton = (props: { onClick?: () => any; }) => {
  return <button type="button" class="bg-saturn-purple rounded-md p-4 hover:bg-purple-800" onClick={props.onClick}>
    <img src={WalletConnectIcon} alt="wallet-connect-icon" width={135} height={22} />
  </button>;
};

WalletConnectButton.displayName = "WalletConnectButton";
export default WalletConnectButton;