import SubwalletIcon from "../assets/icons/subwallet-icon-20x30.png";
import TalismanIcon from "../assets/icons/talisman-icon.svg";
import NovaWalletIcon from "../assets/icons/novawallet-icon-27x27.png";
import PjsIcon from "../assets/icons/pjs-new-icon.png";
// import CrustIcon from "../assets/icons/crust-icon-512x512.svg";
import WalletConnectIcon from "../assets/icons/walletconnect-icon.svg";
import SporranIcon from "../assets/icons/sporran.svg";
import { WalletTypeEnum } from "./consts";

export function matchTypeToIcon(type: string | undefined) {
  if (!type) return;
  const lcType = type.toLowerCase();
  if (WalletTypeEnum.SUBWALLET.toLowerCase().includes(lcType)) {
    return SubwalletIcon;
  } else if (WalletTypeEnum.TALISMAN.toLowerCase().includes(lcType)) {
    return TalismanIcon;
  } else if (WalletTypeEnum.NOVAWALLET.toLowerCase().includes(lcType)) {
    return NovaWalletIcon;
  } else if (WalletTypeEnum.PJS.toLowerCase().includes(lcType)) {
    return PjsIcon;
  } else if (WalletTypeEnum.CRUSTWALLET.toLowerCase().includes(lcType)) {
    return undefined;
    // return CrustIcon;
  } else if (WalletTypeEnum.SPORRAN.toLowerCase().includes(lcType)) {
    return undefined;
    // return SporranIcon;
  } else {
    return WalletConnectIcon;
  }
}