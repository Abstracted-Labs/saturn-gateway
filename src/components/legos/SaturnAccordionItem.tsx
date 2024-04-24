import { CallDetails, CallDetailsWithHash } from "@invarch/saturn-sdk";
import { Call } from "@polkadot/types/interfaces";
import { AnyJson } from "@polkadot/types/types";
import { BN } from "@polkadot/util";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { AssetEnum, AssetHubAssetIdEnum, ExtraAssetDecimalsEnum, RingAssets, Rings } from "../../data/rings";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useBalanceContext } from "../../providers/balanceProvider";
import { NetworkAssetBalance } from "../../pages/Assets";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { NetworkEnum } from "../../utils/consts";
import { getAssetsFromNetwork } from "../../utils/getAssetsFromNetwork";
import BigNumber from "bignumber.js";
import { formatAsset } from "../../utils/formatAsset";

interface ISaturnAccordionItemProps {
  // heading: string;
  contentId: string;
  headingId: string;
  children: any;
  onClick: () => void;
  active: boolean | undefined;
  // icon?: string[];
  callDetails?: CallDetails | null;
  call?: Call;
  metadata?: string;
}

const SaturnAccordionItem = (props: ISaturnAccordionItemProps) => {
  const [asset, setAsset] = createSignal<string | undefined>();
  const [decimals, setDecimals] = createSignal<number | undefined>();
  const [heading, setHeading] = createSignal<string | undefined>();
  const [assetIcon, setAssetIcon] = createSignal<string[] | undefined>();
  const [details, setDetails] = createSignal<CallDetails | null | undefined>();

  const saturnContext = useSaturnContext();
  const ringApisContext = useRingApisContext();
  const balances = useBalanceContext();

  const getBalances = createMemo(() => balances?.balances);
  const getMultisigId = createMemo(() => saturnContext.state.multisigId);

  const handleAccordionItemClick = () => {
    if (props.onClick) {
      props.onClick();
    }
  };

  const getAssetDecimalsFromBalance = (asset: string | undefined): number => {
    const allBalances: NetworkAssetBalance[] | undefined = getBalances();
    if (!allBalances) {
      console.log('exiting getAssetDecimalsFromBalance');
      return 0;
    }
    for (const balance of allBalances) {
      for (const [name, { decimals }] of Object.entries(balance[1])) {
        if (asset === name && decimals) {
          return decimals;
        }
      }
    }
    if (asset && Object.keys(ExtraAssetDecimalsEnum).includes(asset)) {
      return ExtraAssetDecimalsEnum[asset as keyof typeof ExtraAssetDecimalsEnum];
    }
    if (asset && asset in RingAssets) {
      return RingAssets[asset as keyof typeof RingAssets].decimals;
    }
    return 0;
  };

  const fetchPendingCallDetails = async (id: number, callHash: string): Promise<CallDetails | null | undefined> => {
    const call = await saturnContext.state.saturn?.getPendingCall({ id, callHash });
    return call;
  };

  const getAssetFromCallDetails = (assetDetails: any): string | undefined => {
    if (typeof assetDetails === 'object' && assetDetails !== null) {
      const keys = Object.keys(assetDetails);
      if (keys.length > 0) {
        const firstLevelValue = assetDetails[keys[0]];
        if (typeof firstLevelValue === 'string') {
          return firstLevelValue;
        } else if (typeof firstLevelValue === 'object' && firstLevelValue !== null) {
          const secondLevelKeys = Object.keys(firstLevelValue);
          if (secondLevelKeys.length > 0) {
            const secondLevelValue = firstLevelValue[secondLevelKeys[0]];
            if (typeof secondLevelValue === 'string') {
              const matchingKey = Object.entries(AssetHubAssetIdEnum).find(([key, value]) => value === secondLevelValue)?.[0];
              if (matchingKey) {
                return matchingKey;
              }
            }
          }
        }
      }
    }

    return undefined;
  };

  const processNetworkIcons = async (call: Call) => {
    const multisigId = getMultisigId();
    if (!multisigId) return;
    const destinationChain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
    const sourceAssetInfo = ((call.toHuman().args as Record<string, AnyJson>).asset as Record<string, string> | string);
    const sourceChain = typeof sourceAssetInfo !== 'string' && typeof sourceAssetInfo === 'object' ? Object.entries(sourceAssetInfo)[0][0].toLocaleLowerCase() as NetworkEnum : undefined;

    if (destinationChain) {
      const ring = JSON.parse(JSON.stringify(Rings))[destinationChain];
      setAssetIcon([ring.icon]);
      return;
    }

    if (sourceChain) {
      const ring = JSON.parse(JSON.stringify(Rings))[sourceChain];
      setAssetIcon([ring.icon]);
      return;
    }

    if (multisigId) {
      const deets = details();
      if (!deets) return;
      const callHash = deets.actualCall.hash.toString();
      try {
        const result = await fetchPendingCallDetails(multisigId, callHash);
        if (result) {
          const args = result.actualCall.toHuman().args;
          if (args && typeof args === 'object' && 'call_hash' in args && args.call_hash) {
            const innerCallHash = args.call_hash.toString();
            const uncoverDetails = await fetchPendingCallDetails(multisigId, innerCallHash);
            if (uncoverDetails) {
              const moreArgs = uncoverDetails.actualCall.toHuman().args as Record<string, AnyJson>;
              if (!moreArgs || typeof moreArgs !== 'object') return;
              const destination = moreArgs.destination?.toString();
              if (!destination) {
                return;
              };
              const asset = Rings[destination.toLowerCase() as NetworkEnum];
              if (asset) {
                setAssetIcon([asset.icon]);
              }
            }
          } else {
            setAssetIcon([Rings.tinkernet?.icon as NetworkEnum]);
          }
        }
      } catch (error) {
        setAssetIcon([Rings.tinkernet?.icon as NetworkEnum]);
      }
    }
  };


  const fetchAndProcessCallDetails = async (call: Call) => {
    const multisigId = getMultisigId();
    if (!multisigId) return;

    const callDetails = await fetchPendingCallDetails(multisigId, call.hash.toString());
    if (!callDetails) {
      console.log('No call details found');
      return;
    }
    setDetails(callDetails);

    const actualCall = callDetails.actualCall.toHuman();
    if ('method' in actualCall) {
      if (actualCall.method === 'transfer' || actualCall.method === 'transferKeepAlive') {
        setAsset(AssetEnum.TNKR);
      } else if (actualCall.method === 'bridgeAssets' || actualCall.method === 'transferAssets') {
        const args = actualCall.args as Record<string, AnyJson>;
        if (args && args.asset) {
          const possibleAsset = getAssetFromCallDetails(args.asset);
          if (Object.values(AssetEnum).includes(possibleAsset as AssetEnum)) {
            setAsset(possibleAsset as AssetEnum);
          } else {
            const assetKey = Object.keys(AssetHubAssetIdEnum).find(key => key === possibleAsset);
            if (assetKey) {
              setAsset(assetKey);
            }
          }
        }
      }
    }

    // Update decimals based on the asset
    const currentAsset = asset();
    if (currentAsset) {
      const assetDecimals = getAssetDecimalsFromBalance(currentAsset);
      setDecimals(assetDecimals);
    }
  };

  const processCallDescription = (call: Call | undefined, metadata?: string): string => {
    if (!call) {
      return '';
    }
    const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
    const amount = (call.toHuman().args as Record<string, AnyJson>).amount?.toString() || '0';
    const recipient = (call.toHuman().args as Record<string, AnyJson>).to?.toString() || 'self';
    const value = (call.toHuman().args as Record<string, AnyJson>).value?.toString();
    const dest = ((call.toHuman().args as Record<string, AnyJson>).dest as Record<string, AnyJson>);
    const target = (call.toHuman().args as Record<string, AnyJson>).target?.toString() || 'self';
    const cancelHash = (call.toHuman().args as Record<string, AnyJson>).call_hash?.toString();

    let description = `Execute ${ call.section }.${ call.method } call`;

    switch (call.method) {
      case 'sendCall':
        const innerCall = (call.toHuman().args as Record<string, AnyJson>).call?.toString();
        if (chain && innerCall && ringApisContext.state[chain]) {
          const xcmCall = ringApisContext.state[chain].createType('Call', innerCall);
          description = `Execute ${ xcmCall.section }.${ xcmCall.method } call`;
        }
        break;

      case 'cancelMultisigProposal':
        description = `Cancel multisig proposal with call hash ${ cancelHash }`;
        break;

      case 'tokenMint':
        description = `Add new member or increase voting power to ${ new BN(amount).mul(new BN('1000000')).toString() } for ${ target }`;
        break;

      case 'tokenBurn':
        description = `Remove member or decrease voting power by ${ new BN(amount).mul(new BN('1000000')).toString() } for ${ target }`;
        break;

      case 'transfer':
      case 'transferKeepAlive':
        const _transferAsset = asset();
        const _transferDecimals = decimals();
        if (dest && _transferAsset && _transferDecimals) {
          const id = dest.Id?.toString();
          const amt = value?.toString().replace(/,/g, '');
          if (!amt) return '';
          const newAmt = formatAsset(amt, _transferDecimals, 4);
          description = `Transfer ${ newAmt.toString() } ${ _transferAsset } to ${ id }`;
        }
        break;

      case 'transferAssets':
      case 'bridgeAssets':
        const _bridgeAsset = asset();
        const _bridgeDecimals = decimals();
        if (_bridgeAsset && _bridgeDecimals) {
          const amt = amount?.toString().replace(/,/g, '');
          if (!amt) return '';
          const newAmt = formatAsset(amt, _bridgeDecimals, 4);
          description = `Transfer ${ newAmt.toString() } ${ _bridgeAsset } to ${ recipient }`;
        }
        break;

      case 'operateMultisig':
        if (metadata && metadata.includes('removeMember')) {
          description = 'Remove member from multisig';
        } else if (metadata && metadata.includes('proposeNewVotingPower')) {
          description = 'Propose new voting power for a member';
        }
        break;

      case 'batchAll':
        if (metadata && metadata.includes('proposeNewMembers')) {
          description = 'Add new member(s) to multisig';
        }
        break;
    }

    return description;
  };

  createEffect(async () => {
    const call = props.call;
    if (call) {
      await fetchAndProcessCallDetails(call);
    }
  });

  createEffect(() => {
    const call = props.call;
    const metadata = props.metadata;
    const description = processCallDescription(call, metadata);
    setHeading(description);
  });

  createEffect(async () => {
    const deets = details();
    const call = deets?.actualCall;
    if (call) {
      await processNetworkIcons(call);
    }
  });

  return <>
    <h3 id={props.headingId} onClick={handleAccordionItemClick} class="text-sm">
      <button type="button" class="flex items-center justify-between w-full px-3 py-2 font-medium text-left text-black dark:text-white hover:text-white dark:hover:text-white hover:bg-saturn-purple/60 dark:hover:bg-saturn-purple/60 border-b border-px border-gray-200 dark:border-gray-800 focus:outline-none" data-accordion-target={`#${ props.contentId }`} aria-expanded="true" aria-controls={props.contentId}>
        <span class="flex items-center text-xs/tight">
          {assetIcon() ? <img src={assetIcon()?.[0]} class="mr-2 rounded-full w-6 h-6 p-1 bg-black" alt="asset-icon" /> : <div class="mr-2 rounded-full w-6 h-6 bg-saturn-purple"></div>}
          {heading()}
        </span>
        <svg data-accordion-icon class={`w-6 h-6 shrink-0 transition-transform ${ props.active ? 'rotate-180' : 'rotate-0' }`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </h3>
    <div class="hidden transition-all" id={props.contentId} aria-labelledby={props.headingId}>
      {props.children}
    </div>
  </>;
};

SaturnAccordionItem.displayName = 'SaturnAccordionItem';
export default SaturnAccordionItem;