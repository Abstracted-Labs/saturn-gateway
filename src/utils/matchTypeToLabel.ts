import { WalletTypeEnum } from "./consts";

export function matchTypeToLabel(type: string | undefined) {
  if (!type) return;
  const lcType = type.toLowerCase();
  if (WalletTypeEnum.SUBWALLET.toLowerCase().includes(lcType)) {
    return WalletTypeEnum.SUBWALLET;
  } else if (WalletTypeEnum.TALISMAN.toLowerCase().includes(lcType)) {
    return WalletTypeEnum.TALISMAN;
  } else if (WalletTypeEnum.NOVAWALLET.toLowerCase().includes(lcType)) {
    return WalletTypeEnum.NOVAWALLET;
  } else if (WalletTypeEnum.PJS.toLowerCase().includes(lcType)) {
    return WalletTypeEnum.PJS;
  } else if (WalletTypeEnum.CRUSTWALLET.toLowerCase().includes(lcType)) {
    return undefined;
    // return WalletTypeEnum.CRUSTWALLET;
  } else if (WalletTypeEnum.SPORRAN.toLowerCase().includes(lcType)) {
    return undefined;
    // return WalletTypeEnum.SPORRAN;
  } else {
    return WalletTypeEnum.WALLETCONNECT;
  }
}