import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getNetworkBlock(network: NetworkEnum) {
  try {
    if (!network) return;

    switch (network) {
      case NetworkEnum.KUSAMA:
        return <>
          <img src={getAssetIcon('KSM')} alt={NetworkEnum.KUSAMA} width={15} height={20} class="mr-2 block" />
          <span>Kusama</span>
        </>;
      // case NetworkEnum.POLKADOT:
      //   return <>
      //     <img src={getAssetIcon('DOT')} alt={NetworkEnum.POLKADOT} width={15} height={15} class="mr-1 block" />
      //     <span>Polkadot</span>
      //   </>;
      case NetworkEnum.TINKERNET:
        return <>
          <img src={getAssetIcon('TNKR')} alt={NetworkEnum.TINKERNET} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Tinkernet</span>
        </>;
      case NetworkEnum.BASILISK:
        return <>
          <img src={getAssetIcon('BSX')} alt={NetworkEnum.BASILISK} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Basilisk</span>
        </>;
      case NetworkEnum.PICASSO:
        return <>
          <img src={getAssetIcon('PICA')} alt={NetworkEnum.PICASSO} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Picasso</span>
        </>;
      case NetworkEnum.ASSETHUB:
        return <>
          <img src={getAssetIcon('ASSETHUB')} alt={NetworkEnum.ASSETHUB} width={15} height={15} class="mr-2 block bg-saturn-black rounded-full" />
          <span>AssetHub</span>
        </>;
      case NetworkEnum.BIFROST:
        return <>
          <img src={getAssetIcon('BNC')} alt={NetworkEnum.BIFROST} width={15} height={15} class="mr-2 bloc rounded-full" />
          <span>Bifrost</span>
        </>;
      case NetworkEnum.SHIDEN:
        return <>
          <img src={getAssetIcon('SDN')} alt={NetworkEnum.SHIDEN} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Shiden</span>
        </>;
      case NetworkEnum.KARURA:
        return <>
          <img src={getAssetIcon('KAR')} alt={NetworkEnum.KARURA} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Karura</span>
        </>;
      case NetworkEnum.MOONRIVER:
        return <>
          <img src={getAssetIcon('MOVR')} alt={NetworkEnum.MOONRIVER} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Moonriver</span>
        </>;
      case NetworkEnum.TURING:
        return <>
          <img src={getAssetIcon('TUR')} alt={NetworkEnum.TURING} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Turing</span>
        </>;
      case NetworkEnum.KHALA:
        return <>
          <img src={getAssetIcon('KHA', NetworkEnum.KHALA)} alt={NetworkEnum.KHALA} width={15} height={15} class="mr-2 block rounded-full" />
          <span>Khala</span>
        </>;
      default:
        return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}