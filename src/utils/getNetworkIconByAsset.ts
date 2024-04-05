import { AssetEnum } from "../data/rings";
import { NetworkEnum, NetworkIconByCurrency, NetworkIconByNetwork } from "./consts";

export function getNetworkIconByAsset(name: string) {
  if (NetworkIconByCurrency[name] === undefined) {
    return NetworkIconByCurrency[AssetEnum.ASSETHUB];
  }
  return NetworkIconByCurrency[name];
}