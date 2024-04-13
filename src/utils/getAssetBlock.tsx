import { AssetEnum, AssetHubEnum, ExtraAssetEnum } from "../data/rings";
import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getAssetBlock(asset: AssetEnum | AssetHubEnum | ExtraAssetEnum | string | null | undefined, network?: NetworkEnum) {
  try {
    if (!asset) {
      throw new Error('Network is not defined.');
    }

    switch (asset) {
      case AssetEnum.KSM:
        return <>
          <img src={getAssetIcon(AssetEnum.KSM)} alt={AssetEnum.KSM} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.KSM}</span>
        </>;
      // case AssetEnum.DOT:
      //   return <>
      //     <img src={getAssetIcon(AssetEnum.DOT)} alt={AssetEnum.DOT} width={20} height={20} class="mr-1 block" />
      //     <span>{AssetEnum.DOT}</span>
      //   </>;
      case AssetEnum.TNKR:
        return <>
          <img src={getAssetIcon(AssetEnum.TNKR)} alt={AssetEnum.TNKR} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.TNKR}</span>
        </>;
      case AssetEnum.BSX:
        return <>
          <img src={getAssetIcon(AssetEnum.BSX)} alt={AssetEnum.BSX} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.BSX}</span>
        </>;
      case AssetEnum.PICA:
        return <>
          <img src={getAssetIcon(AssetEnum.PICA)} alt={AssetEnum.PICA} width={20} height={20} class="mr-2 block bg-saturn-black" />
          <span>{AssetEnum.PICA}</span>
        </>;
      case AssetEnum.ASSETHUB:
        return <>
          <img src={getAssetIcon(AssetEnum.ASSETHUB)} alt={AssetEnum.ASSETHUB} width={20} height={20} class="mr-2 block" />
          <span class="assethub-token">{AssetEnum.ASSETHUB}</span>
        </>;
      case AssetEnum.BNC:
        return <>
          <img src={getAssetIcon(AssetEnum.BNC)} alt={AssetEnum.BNC} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.BNC}</span>
        </>;
      case AssetEnum.PHA:
        return <>
          <img src={getAssetIcon(AssetEnum.PHA)} alt={AssetEnum.PHA} width={20} height={20} class="mr-2 block" />
          <span>K-PHA</span>
        </>;
      case AssetEnum.KAR:
        return <>
          <img src={getAssetIcon(AssetEnum.KAR)} alt={AssetEnum.KAR} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.KAR}</span>
        </>;
      case AssetEnum.TUR:
        return <>
          <img src={getAssetIcon(AssetEnum.TUR)} alt={AssetEnum.TUR} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.TUR}</span>
        </>;
      case AssetEnum.MOVR:
        return <>
          <img src={getAssetIcon(AssetEnum.MOVR)} alt={AssetEnum.MOVR} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.MOVR}</span>
        </>;
      case AssetEnum.SDN:
        return <>
          <img src={getAssetIcon(AssetEnum.SDN)} alt={AssetEnum.SDN} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.SDN}</span>
        </>;
      // case ExtraAssetEnum.ZLK:
      //   return <>
      //     <img src={getAssetIcon(ExtraAssetEnum.ZLK, true)} alt={ExtraAssetEnum.ZLK} width={20} height={20} class="mr-2 block" />
      //     <span>{ExtraAssetEnum.ZLK}</span>
      //   </>;
      default:
        return <>
          <img src={getAssetIcon(asset, network)} alt={asset} width={20} height={20} class="mr-2 block" />
          <span class="assethub-token">{asset}</span>
        </>;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}