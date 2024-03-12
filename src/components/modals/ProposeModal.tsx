import { Accessor, createMemo, createSignal, Match, Switch } from 'solid-js';
import { FeeAsset } from '@invarch/saturn-sdk';
import type { Call } from '@polkadot/types/interfaces';
import { u8aToHex, BN } from "@polkadot/util";
import { BigNumber } from 'bignumber.js';
import { useProposeContext, ProposalType, ProposeContextType, ProposalData } from "../../providers/proposeProvider";
import { SaturnContextType, useSaturnContext } from "../../providers/saturnProvider";
import { IRingsContext, useRingApisContext } from "../../providers/ringApisProvider";
import { SelectedAccountState, useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import FormattedCall from '../legos/FormattedCall';
import { RingAssets } from "../../data/rings";
import { formatAsset } from '../../utils/formatAsset';
import { NetworkEnum } from '../../utils/consts';
import { MegaModalContextType, useMegaModal } from '../../providers/megaModalProvider';

export const PROPOSE_MODAL_ID = 'proposeModal';

type TransferProposalProps = {
  amount: BN | BigNumber | string;
  asset: string;
  to: string;
};

type CallProposalProps = {
  encodedCall: Uint8Array;
  chain: string;
};

type SelectedAccountContextType = {
  state: SelectedAccountState;
  setters: any;
};

export type IProposalProps = {
  preview: boolean;
  selectedAccountContext: SelectedAccountContextType;
  saturnContext: SaturnContextType;
  proposeContext: ProposeContextType;
  ringApisContext: IRingsContext;
  modalContext: MegaModalContextType;
  message: Accessor<string>;
  feeAsset: Accessor<FeeAsset>;
};

const TransferProposal = (props: TransferProposalProps) => {
  return (
    <div>
      <p>Amount: {
        BigNumber(props.amount.toString()).div(
          BigNumber('10').pow(
            BigNumber(RingAssets[props.asset as keyof typeof RingAssets].decimals),
          ),
        ).decimalPlaces(2, 1).toString()
      } {props.asset}</p>
      <p>To: {props.to}</p>
    </div>
  );
};

const CallProposal = (props: CallProposalProps) => {
  const ringApisContext = useRingApisContext();

  return <FormattedCall
    call={ringApisContext.state[props.chain].createType("Call", props.encodedCall) as unknown as Call}
  />;
};

export const proposeCall = async (props: IProposalProps) => {
  const { preview, proposeContext, saturnContext, selectedAccountContext, ringApisContext, modalContext, message, feeAsset } = props;
  const selected = selectedAccountContext?.state;

  if (!saturnContext.state.saturn || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number' || proposeContext.state.proposal === undefined) {
    return;
  }

  const msg = message();

  let proposalMetadata;
  if (msg) {
    proposalMetadata = JSON.stringify({ message: msg });
  }

  const proposalData = proposeContext.state.proposal.data;
  const proposalType = proposeContext.state.proposal.proposalType;

  console.log("data, type: ", proposalData, (proposalData as any).amount.toNumber(), proposalType);

  try {
    // LocalCall
    if (proposalType === ProposalType.LocalCall && (proposalData as { encodedCall: Uint8Array; }).encodedCall) {
      console.log("in LocalCall");

      await saturnContext.state.saturn
        .buildMultisigCall({
          id: saturnContext.state.multisigId,
          call: (proposalData as { encodedCall: Uint8Array; }).encodedCall,
          proposalMetadata,
          feeAsset: feeAsset()
        })
        .signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
      return;
    }

    // XcmCall
    if (
      proposalType === ProposalType.XcmCall &&
      (proposalData as { encodedCall: Uint8Array; }).encodedCall &&
      (proposalData as { chain: string; }).chain
    ) {
      console.log("in XcmCall");

      const chain = (proposalData as { chain: string; }).chain;
      const callData = (proposalData as { encodedCall: Uint8Array; }).encodedCall;

      console.log("callData: ", u8aToHex(callData));

      const xcmFeeAsset = saturnContext.state.saturn.chains.find((c) => c.chain.toLowerCase() == chain)?.assets[0].registerType;

      if (!xcmFeeAsset || !saturnContext.state.multisigAddress) return;

      const c = ringApisContext.state[chain].createType("Call", callData);
      const { weight, partialFee } = await ringApisContext.state[chain].tx(c).paymentInfo(saturnContext.state.multisigAddress);
      const totalWeight = new BN(weight.refTime.toString()).add(new BN(weight.proofSize.toString()));
      const fee = new BN(partialFee.toString());

      await saturnContext.state.saturn
        .sendXCMCall({
          id: saturnContext.state.multisigId,
          destination: chain,
          callData,
          xcmFeeAsset,
          xcmFee: fee.mul(new BN("10")),
          weight: totalWeight,
          proposalMetadata,
        })
        .signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
      return;
    }

    // XcmTransfer
    if (
      proposalType === ProposalType.XcmTransfer &&
      (proposalData as { chain: string; }).chain &&
      (proposalData as { destinationChain: string; }).destinationChain &&
      (((proposalData as { chain: string; }).chain === NetworkEnum.TINKERNET &&
        (proposalData as { destinationChain: string; }).destinationChain !== NetworkEnum.TINKERNET) || ((proposalData as { chain: string; }).chain !== NetworkEnum.TINKERNET && (proposalData as { chain: string; }).chain === (proposalData as { destinationChain: string; }).destinationChain))
    ) {
      console.log("in XcmTransfer");

      const chain = (proposalData as { destinationChain: string; }).destinationChain;
      const amount = (proposalData as { amount: BN | BigNumber | string; }).amount || '0';
      const to = (proposalData as { to: string; }).to;
      const asset = (proposalData as { asset: string; }).asset;

      const xcmAsset = saturnContext.state.saturn.chains.find((c) => c.chain.toLowerCase() == chain)?.assets.find((a) => a.label == asset)?.registerType;
      console.log("Found xcmAsset: ", xcmAsset);

      if (!xcmAsset) {
        console.error("xcmAsset is undefined. Check chain and asset names for typos or case sensitivity issues.");
      }

      if (!xcmAsset || !saturnContext.state.multisigAddress) return;

      const { partialFee } = await ringApisContext.state[(proposalData as { chain: string; }).chain].tx.balances.transfer(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

      const transferCall = saturnContext.state.saturn
        .transferXcmAsset({
          id: saturnContext.state.multisigId,
          asset: xcmAsset,
          amount: new BN(amount.toString()),
          to,
          xcmFeeAsset: xcmAsset,
          xcmFee: new BN(partialFee).mul(new BN("2")),
          proposalMetadata,
        });

      if (!preview) {
        await transferCall.signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
        modalContext.showProposeModal();
        return;
      } else {
        const partialFeePreview = formatAsset(new BN(partialFee).toString(), RingAssets[asset as keyof typeof RingAssets].decimals, 2);
        console.log("partialFeePreview: ", partialFeePreview);
        return partialFeePreview;
      }
    }

    // LocalTransfer
    if (
      proposalType === ProposalType.LocalTransfer &&
      (proposalData as { chain: string; }).chain &&
      (proposalData as { chain: string; }).chain === NetworkEnum.TINKERNET &&
      (proposalData as { destinationChain: string; }).destinationChain &&
      (proposalData as { destinationChain: string; }).destinationChain === NetworkEnum.TINKERNET
    ) {
      console.log("in LocalTransfer");

      const chain = (proposalData as { chain: string; }).chain;
      const amount = (proposalData as { amount: BN | BigNumber | string; }).amount;
      const to = (proposalData as { to: string; }).to;
      const asset = (proposalData as { asset: string; }).asset;

      if (!saturnContext.state.multisigAddress) {
        console.error("Multisig address is undefined. Exiting early.");
        return;
      };

      const { partialFee } = await ringApisContext.state[chain].tx.balances.transfer(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

      const localTransferCall = ringApisContext.state[chain].tx.balances.transfer(to, new BN(amount.toString()));

      if (!preview) {
        await localTransferCall.signAndSend(selected.account.address, { signer: selected.wallet.signer, assetId: feeAsset() });
        modalContext.showProposeModal();
        return;
      } else {
        const partialFeePreview = formatAsset(new BN(partialFee).toString(), RingAssets[asset as keyof typeof RingAssets].decimals, 2);
        console.log("partialFeePreview: ", partialFeePreview);
        return partialFeePreview;
      }
    }

    // XcmBridge
    if (
      proposalType === ProposalType.XcmBridge &&
      (proposalData as { chain: string; }).chain &&
      (proposalData as { destinationChain: string; }).destinationChain &&
      (proposalData as { chain: string; }).chain !== NetworkEnum.TINKERNET &&
      (proposalData as { chain: string; }).chain !== (proposalData as { destinationChain: string; }).destinationChain
    ) {
      console.log("in XcmBridge");

      const chain = (proposalData as { chain: string; }).chain;
      const amount = (proposalData as { amount: BN | BigNumber | string; }).amount;
      const to = (proposalData as { to: string; }).to;
      const asset = (proposalData as { asset: string; }).asset;
      console.log('saturnContext.state.saturn.chains', saturnContext.state.saturn.chains);
      const xcmAsset = saturnContext.state.saturn.chains.find((c) => c.chain.toLowerCase() == chain)?.assets.find((a) => a.label == asset)?.registerType;

      console.log("Found xcmAsset: ", xcmAsset);

      if (!xcmAsset) {
        console.error("xcmAsset is undefined. Check chain and asset names for typos or case sensitivity issues.");
      }

      if (!xcmAsset || !saturnContext.state.multisigAddress) return;

      const { partialFee } = await ringApisContext.state[chain].tx.balances.transfer(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

      const bridgeCall = saturnContext.state.saturn
        .bridgeXcmAsset({
          id: saturnContext.state.multisigId,
          asset: xcmAsset,
          amount: new BN(amount.toString()),
          to,
          xcmFee: new BN(partialFee).mul(new BN("2")),
          destination: (proposalData as { destinationChain: string; }).destinationChain,
          proposalMetadata,
        });

      if (!preview) {
        await bridgeCall.signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
        modalContext.showProposeModal();
        return;
      } else {
        const partialFeePreview = formatAsset(new BN(partialFee).toString(), RingAssets[asset as keyof typeof RingAssets].decimals);
        console.log("partialFeePreview: ", partialFeePreview);
        return partialFeePreview;
      }
    }

    // Unknown proposal type
    throw new Error(JSON.stringify({
      chain: proposalData.chain, asset: (proposalData as any).asset, to: (proposalData as any).to, amount: (proposalData as any).amount
    }));
  } catch (e) {
    console.error("Unknown proposal type or missing data for proposal type: ", e);
  }
};

export default function ProposeModal() {
  const [message, setMessage] = createSignal<string>('');
  const [feeAsset, setFeeAsset] = createSignal<FeeAsset>(FeeAsset.TNKR);

  const ringApisContext = useRingApisContext();
  const proposeContext = useProposeContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const modalContext = useMegaModal();

  const closeModal = () => {
    modalContext.hideProposeModal();
  };

  const processHeader = (): string => {
    switch (maybeProposal()?.proposalType) {
      default:
        return "Call";

      // Same source and destination chains
      case ProposalType.LocalTransfer:
        return "Balance Transfer";

      // Different source and destination chains
      case ProposalType.XcmTransfer:
        return "Balance Transfer";

      case ProposalType.LocalCall:
        return "Call";

      case ProposalType.XcmCall:
        return "Call";

      // Cross-chain asset transfer using same account address
      case ProposalType.XcmBridge:
        return "Asset Bridge";
    }
  };

  const maybeProposal = createMemo(() => proposeContext.state.proposal);
  const networkName = createMemo(() => proposeContext.state.proposal?.data.chain);

  const ModalBody = () => <div class='h-auto flex flex-col gap-1 text-xs'>
    <div class="flex flex-row gap-2">
      <label for="feeAssetToggle" class="relative inline-flex items-center mr-5 cursor-pointer">
        <input type="checkbox" name="feeAssetToggle" value={feeAsset()} onInput={() => feeAsset() === FeeAsset.TNKR ? setFeeAsset(FeeAsset.KSM) : setFeeAsset(FeeAsset.TNKR)} checked={feeAsset() != FeeAsset.TNKR} class="sr-only peer theme-color-toggle" />
        <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-100 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
        <span class="ml-3 text-sm font-medium text-saturn-lightgrey dark:text-saturn-lightgrey">{feeAsset() === FeeAsset.TNKR ? 'TNKR' : 'KSM'}</span>
      </label>
    </div>
    <p>Network: <span class="capitalize text-black dark:text-white">{networkName() || '--'}</span></p>
    <Switch>
      <Match when={
        proposeContext.state.proposal?.proposalType === ProposalType.LocalCall ||
        proposeContext.state.proposal?.proposalType === ProposalType.XcmCall
      }>
        {
          maybeProposal() &&
          (maybeProposal()?.data as { encodedCall: Uint8Array; }).encodedCall &&
          (maybeProposal()?.data as { chain: string; }).chain &&
          (<CallProposal
            encodedCall={(maybeProposal()?.data as { encodedCall: Uint8Array; }).encodedCall}
            chain={(maybeProposal()?.data as { chain: string; }).chain}
          />)
        }
      </Match>
      <Match when={
        proposeContext.state.proposal?.proposalType === ProposalType.LocalTransfer ||
        proposeContext.state.proposal?.proposalType === ProposalType.XcmTransfer
      }>
        {
          maybeProposal() &&
          (maybeProposal()?.data as { amount: BN | BigNumber | string; }).amount &&
          (maybeProposal()?.data as { asset: string; }).asset &&
          (maybeProposal()?.data as { to: string; }).to &&
          (<TransferProposal
            amount={(maybeProposal()?.data as { amount: BN | BigNumber | string; }).amount}
            asset={(maybeProposal()?.data as { asset: string; }).asset}
            to={(maybeProposal()?.data as { to: string; }).to}
          />)
        }
      </Match>
    </Switch>
    <input
      type='text'
      placeholder='Add message (optional)'
      value={message()}
      onInput={e => {
        setMessage(e.currentTarget.value);
      }}
    />
    <button type="button" class="dark:bg-saturn-purple bg-saturn-purple rounded-md p-4 hover:bg-purple-800 dark:hover:bg-purple-800 focus:outline-none" onClick={() => proposeCall({ preview: false, selectedAccountContext, saturnContext, proposeContext, message, feeAsset, ringApisContext, modalContext })}>Propose</button>
  </div>;

  return <>
    {/* <ConnectButton /> */}
    <div id={PROPOSE_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
      <div id="proposeModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1" />
      <div class={`relative px-4 bg-saturn-offwhite dark:bg-black rounded-md m-5 md:m-auto`}>
        <div class="flex flex-row grow-1 items-start justify-between p-4">
          <h4 class="text-md font-semibold text-gray-900 dark:text-white">
            Propose Multisig {processHeader()}
          </h4>
          <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={closeModal}>
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <div class="flex flex-col">
          <ModalBody />
          {/* <div class="flex flex-row justify-end gap-2 items-center m-6">
            <LogoutButton cancel={true} proposeModal={true} onClick={closeModal} />
          </div> */}
        </div>
      </div>
    </div>
  </>;
}
