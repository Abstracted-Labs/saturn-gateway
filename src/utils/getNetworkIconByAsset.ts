import { AssetEnum } from "../data/rings";
import { NetworkEnum, NetworkIconByCurrency, NetworkIconByNetwork } from "./consts";

export function getNetworkIconByAsset(asset: string, network?: string) {
  if (network) {
    if (NetworkIconByCurrency[asset] && NetworkIconByCurrency[asset].length > 0) {
      return NetworkIconByCurrency[asset][0];
    } else {
      return NetworkIconByNetwork[network as NetworkEnum];
    }
  } else {
    return NetworkIconByCurrency[asset] ?? NetworkIconByCurrency[AssetEnum.ASSETHUB];
  }
}