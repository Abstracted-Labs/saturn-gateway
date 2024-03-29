import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getNetworkBlock(network: NetworkEnum) {
  try {
    if (!network) {
      throw new Error('Network is not defined.');
    }

    switch (network) {
      case NetworkEnum.KUSAMA:
        return <>
          <img src={getAssetIcon('KSM')} alt={NetworkEnum.KUSAMA} width={15} height={20} class="mr-2 block" />
          <span>Kusama</span>
        </>;
      case NetworkEnum.POLKADOT:
        return <>
          <img src={getAssetIcon('DOT')} alt={NetworkEnum.POLKADOT} width={15} height={15} class="mr-1 block" />
          <span>Polkadot</span>
        </>;
      case NetworkEnum.TINKERNET:
        return <>
          <img src={getAssetIcon('TNKR')} alt={NetworkEnum.TINKERNET} width={15} height={15} class="mr-2 block" />
          <span>Tinkernet</span>
        </>;
      case NetworkEnum.BASILISK:
        return <>
          <img src={getAssetIcon('BSX')} alt={NetworkEnum.BASILISK} width={15} height={15} class="mr-2 block" />
          <span>Basilisk</span>
        </>;
      case NetworkEnum.PICASSO:
        return <>
          <img src={getAssetIcon('PICA')} alt={NetworkEnum.PICASSO} width={13} height={10} class="mr-2 block bg-saturn-black" />
          <span>Picasso</span>
        </>;
      case NetworkEnum.ASSETHUB:
        return <>
          <img src={getAssetIcon('ASSETHUB')} alt={NetworkEnum.ASSETHUB} width={15} height={15} class="mr-2 block bg-saturn-black" />
          <span>AssetHub</span>
        </>;
      default:
        return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}