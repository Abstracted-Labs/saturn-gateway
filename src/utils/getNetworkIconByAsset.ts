import { NetworkIconByCurrency } from "./consts";

export function getNetworkIconByAsset(name: string) {
  return NetworkIconByCurrency[name];
}