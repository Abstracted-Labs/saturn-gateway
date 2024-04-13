import { AssetEnum } from "../data/rings";
import { AssetIconByCurrency, NetworkEnum, NetworkIconByCurrency, NetworkIconByNetwork } from "./consts";

export function getAssetIcon(asset: string, network?: NetworkEnum) {
  if (network) {
    if (NetworkIconByCurrency[asset] && NetworkIconByCurrency[asset].length > 0) {
      return NetworkIconByCurrency[asset][0];
    } else {
      return NetworkIconByNetwork[network as NetworkEnum];
    }
  } else {
    return AssetIconByCurrency[asset] ?? AssetIconByCurrency[AssetEnum.ASSETHUB];
  }
}