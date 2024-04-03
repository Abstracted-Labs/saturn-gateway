import { NetworkEnum, NetworkIconByNetwork } from "./consts";

export function getNetworkIconByNetwork(name: NetworkEnum) {
  return NetworkIconByNetwork[name];
}