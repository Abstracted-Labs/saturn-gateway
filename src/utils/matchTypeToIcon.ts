import SubwalletIcon from "../assets/icons/subwallet-icon-20x30.png";
import TalismanIcon from "../assets/icons/talisman-icon.svg";
import NovaWalletIcon from "../assets/icons/novawallet-icon-27x27.png";
import PjsIcon from "../assets/icons/pjs-new-icon.png";
import CrustIcon from "../assets/icons/crust-icon-512x512.svg";
import { WalletTypeEnum } from "./consts";

export function matchTypeToIcon(type: string | undefined) {
  if (!type) return;
  if (WalletTypeEnum.SUBWALLET.toLowerCase().includes(type)) {
    return SubwalletIcon;
  } else if (WalletTypeEnum.TALISMAN.toLowerCase().includes(type)) {
    return TalismanIcon;
  } else if (WalletTypeEnum.NOVAWALLET.toLowerCase().includes(type)) {
    return NovaWalletIcon;
  } else if (WalletTypeEnum.PJS.toLowerCase().includes(type)) {
    return PjsIcon;
  } else if (WalletTypeEnum.CRUSTWALLET.toLowerCase().includes(type)) {
    return CrustIcon;
  }
}