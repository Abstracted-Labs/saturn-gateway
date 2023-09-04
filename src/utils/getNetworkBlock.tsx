import { createMemo } from "solid-js";
import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getNetworkBlock(network: NetworkEnum) {
  // network blocks
  const NetworkKusama = createMemo(() => <>
    <img src={getAssetIcon('KSM')} alt={NetworkEnum.KUSAMA} width={20} height={13} class="mr-2 block bg-saturn" />
    <span>Kusama</span>
  </>);
  const NetworkPolkadot = createMemo(() => <>
    <img src={getAssetIcon('DOT')} alt={NetworkEnum.POLKADOT} width={25} height={25} class="mr-1 block" />
    <span>Polkadot</span>
  </>);
  const NetworkTinkernet = createMemo(() => <>
    <img src={getAssetIcon('TNKR')} alt={NetworkEnum.TINKERNET} width={20} height={20} class="mr-2 block bg-saturn" />
    <span>Tinkernet</span>
  </>);

  try {
    if (!network) {
      throw new Error('Network is not defined.');
    }

    switch (network) {
      case NetworkEnum.KUSAMA:
        return <NetworkKusama />;
      case NetworkEnum.POLKADOT:
        return <NetworkPolkadot />;
      case NetworkEnum.TINKERNET:
        return <NetworkTinkernet />;
      default:
        return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}