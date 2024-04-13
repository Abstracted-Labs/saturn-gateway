import { AssetEnum } from "../data/rings";
import { AssetIconByCurrency, NetworkEnum, NetworkIconByCurrency } from "./consts";

export function getAssetIcon(asset: string, isExtra?: boolean | undefined) {
  if (!!isExtra && isExtra) {
    return NetworkIconByCurrency[asset][0];
  }
  if (AssetIconByCurrency[asset] === undefined) {
    return AssetIconByCurrency[AssetEnum.ASSETHUB];
  }
  return AssetIconByCurrency[asset];
}