import { WalletTypeEnum } from "./consts";

export function matchTypeToLabel(type: string | undefined) {
  if (!type) return;
  if (WalletTypeEnum.SUBWALLET.toLowerCase().includes(type)) {
    return WalletTypeEnum.SUBWALLET;
  } else if (WalletTypeEnum.TALISMAN.toLowerCase().includes(type)) {
    return WalletTypeEnum.TALISMAN;
  } else if (WalletTypeEnum.NOVAWALLET.toLowerCase().includes(type)) {
    return WalletTypeEnum.NOVAWALLET;
  } else if (WalletTypeEnum.PJS.toLowerCase().includes(type)) {
    return WalletTypeEnum.PJS;
  } else if (WalletTypeEnum.CRUSTWALLET.toLowerCase().includes(type)) {
    return WalletTypeEnum.CRUSTWALLET;
  }
}