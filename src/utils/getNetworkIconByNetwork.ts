import { NetworkEnum, NetworkIconByNetwork } from "./consts";

export function getNetworkIconByNetwork(name: NetworkEnum) {
  console.log('getting icon by network: ', NetworkIconByNetwork[name]);
  return NetworkIconByNetwork[name];
}