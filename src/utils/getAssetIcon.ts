import { AssetEnum } from "../data/rings";
import { AssetIconByCurrency } from "./consts";

export function getAssetIcon(asset: string) {
  if (AssetIconByCurrency[asset] === undefined) {
    return AssetIconByCurrency[AssetEnum.ASSETHUB];
  }
  return AssetIconByCurrency[asset];
}