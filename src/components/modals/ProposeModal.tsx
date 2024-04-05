import { Accessor, createEffect, createMemo, createSignal, Match, Show, Switch } from 'solid-js';
import { FeeAsset, MultisigCallResult } from '@invarch/saturn-sdk';
import type { Call, DispatchResult } from '@polkadot/types/interfaces';
import { u8aToHex, BN } from "@polkadot/util";
import { BigNumber } from 'bignumber.js';
import { useProposeContext, ProposalType, ProposeContextType, ProposalData } from "../../providers/proposeProvider";
import { SaturnContextType, useSaturnContext } from "../../providers/saturnProvider";
import { IRingsContext, useRingApisContext } from "../../providers/ringApisProvider";
import { SelectedAccountState, useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import FormattedCall from '../legos/FormattedCall';
import { RingAssets } from "../../data/rings";
import { formatAsset } from '../../utils/formatAsset';
import { INPUT_COMMON_STYLE, KusamaFeeAssetEnum, NetworkEnum } from '../../utils/consts';
import { MegaModalContextType, useMegaModal } from '../../providers/megaModalProvider';
import { ISubmittableResult } from '@kiltprotocol/sdk-js';
import { ToastContextType, useToast } from '../../providers/toastProvider';

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
  toast: ToastContextType;
};

const TransferProposal = (props: TransferProposalProps) => {
  console.log('props.asset', props.asset);
  return (
    <div class="flex flex-col gap-2">
      <p class="border-t border border-gray-700 border-dashed pt-2">Amount: <span class="capitalize text-black dark:text-white float-right font-bold">{
        BigNumber(props.amount.toString()).div(
          BigNumber('10').pow(
            BigNumber(RingAssets[props.asset as keyof typeof RingAssets].decimals),
          ),
        ).decimalPlaces(2, 1).toString()
      } {props.asset}</span></p>
      <p class="border-t border-b border border-gray-700 border-dashed py-2">To: <span class="capitalize text-black dark:text-white float-right font-bold">{props.to}</span></p>
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
  const { preview, proposeContext, saturnContext, selectedAccountContext, ringApisContext, modalContext, message, feeAsset, toast } = props;
  const selected = selectedAccountContext?.state;

  if (!saturnContext.state.saturn || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number' || proposeContext.state.proposal === undefined || !modalContext) {
    toast.setToast('Invalid proposal state or missing account details', 'error');
    return;
  }

  const modal = modalContext;
  const msg = message();
  let proposalMetadata;

  if (msg) {
    proposalMetadata = JSON.stringify({ message: msg });
  }

  const proposalData = proposeContext.state.proposal.data;
  const proposalType = proposeContext.state.proposal.proposalType;

  if (!preview) {
    toast.setToast('Processing proposal...', 'loading');
  }

  try {
    // LocalCall
    if (proposalType === ProposalType.LocalCall && (proposalData as { encodedCall: Uint8Array; }).encodedCall) {
      console.log("in LocalCall");

      await saturnContext.state.saturn
        .buildMultisigCall({
          id: saturnContext.state.multisigId,
          call: (proposalData as { encodedCall: Uint8Array; }).encodedCall,
          proposalMetadata,
          feeAsset: FeeAsset[feeAsset()] as unknown as FeeAsset,
        })
        .signAndSend(selected.account.address, selected.wallet.signer, feeAsset());

      toast.setToast('Local call proposal submitted successfully', 'success');

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

      toast.setToast('XCM call proposal submitted successfully', 'success');

      modal.hideProposeModal();

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

      const { partialFee } = await ringApisContext.state[(proposalData as { chain: string; }).chain].tx.balances.transferKeepAlive(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

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

        toast.setToast('XCM Transfer proposal submitted successfully', 'success');

        modal.hideProposeModal();

        return;
      } else {
        const partialFeePreview = formatAsset(new BN(partialFee).toString(), RingAssets[asset as keyof typeof RingAssets].decimals, 2);
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
      const amount = (proposalData as { amount: BN | BigNumber; }).amount;
      const to = (proposalData as { to: string; }).to;
      const asset = (proposalData as { asset: string; }).asset;

      if (!saturnContext.state.multisigAddress) {
        console.error("Multisig address is undefined. Exiting early.");
        return;
      };

      const { partialFee } = await ringApisContext.state[chain].tx.balances.transferKeepAlive(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

      const localTransferCall = ringApisContext.state[chain].tx.balances.transferKeepAlive(to, new BN(amount.toString()));

      const multisigCall = saturnContext.state.saturn
        .buildMultisigCall({
          id: saturnContext.state.multisigId,
          call: localTransferCall,
          proposalMetadata,
          feeAsset: FeeAsset[feeAsset()] as unknown as FeeAsset,
        });

      if (!preview) {
        const result: MultisigCallResult = await multisigCall.signAndSend(selected.account.address, selected.wallet.signer, feeAsset());

        if (result && result.executionResult) {
          const dispatchResult: DispatchResult = result.executionResult;

          if (dispatchResult.isOk) {
            toast.setToast('Local transfer proposal submitted successfully', 'success');
          }

          if (dispatchResult.isErr) {
            console.error("Error submitting proposal: ", result);
            throw new Error(JSON.stringify(result));
          }
        }

        modal.hideProposeModal();

        return;
      } else {
        const partialFeePreview = formatAsset(new BN(partialFee).toString(), RingAssets[asset as keyof typeof RingAssets].decimals, 2);
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

      let partialFee = new BN("0");
      try {
        const feeInfo = (await ringApisContext.state[chain].tx.balances.transferKeepAlive(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress));
        partialFee = feeInfo.partialFee.mul(new BN("2"));
      } catch (error) {
        console.error('Error fetching fee, using default fee: ', error);
        partialFee = new BN("10000000000");
      }

      const bridgeCall = saturnContext.state.saturn
        .bridgeXcmAsset({
          id: saturnContext.state.multisigId,
          asset: xcmAsset,
          amount: new BN(amount.toString()),
          to,
          xcmFee: partialFee,
          destination: (proposalData as { destinationChain: string; }).destinationChain,
          proposalMetadata,
        });

      if (!preview) {
        await bridgeCall.signAndSend(selected.account.address, selected.wallet.signer, feeAsset());

        toast.setToast('XCM Bridge proposal submitted successfully', 'success');

        modal.hideProposeModal();

        return;
      } else {
        const partialFeePreview = formatAsset(partialFee.toString(), RingAssets[asset as keyof typeof RingAssets].decimals, 4);
        return partialFeePreview;
      }
    }

    // Unknown proposal type
    throw new Error(JSON.stringify({
      chain: proposalData.chain, destinationChain: (proposalData as any).destinationChain, asset: (proposalData as any).asset, to: (proposalData as any).to, amount: (proposalData as any).amount
    }));
  } catch (error) {
    console.error(error);
    if (!preview) {
      toast.setToast('Error submitting proposal', 'error');
    }
  }
};

export default function ProposeModal() {
  const [message, setMessage] = createSignal<string>('');
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>(KusamaFeeAssetEnum.TNKR);

  const ringApisContext = useRingApisContext();
  const proposeContext = useProposeContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const modalContext = useMegaModal();
  const toast = useToast();

  const closeModal = () => {
    modalContext.hideProposeModal();
  };

  const processHeader = (): string => {
    switch (maybeProposal()?.proposalType) {
      default:
        return "Call";

      // Same source and destination chains
      case ProposalType.LocalTransfer:
        return "Local Balance Transfer";

      // Different source and destination chains
      case ProposalType.XcmTransfer:
        return "XCM Balance Transfer";

      case ProposalType.LocalCall:
        return "Local Call";

      case ProposalType.XcmCall:
        return "XCM Call";

      // Cross-chain asset transfer using same account address
      case ProposalType.XcmBridge:
        return "XCM Bridge";
    }
  };

  const maybeProposal = createMemo(() => proposeContext.state.proposal);
  const networkName = createMemo(() => proposeContext.state.proposal?.data.chain);

  createEffect(() => {
    const selectedAsset = selectedAccountContext.setters.getFeeAsset() as KusamaFeeAssetEnum;
    setFeeAsset(selectedAsset);
  });

  const ModalBody = () => <div class='flex flex-col gap-2 p-4 text-xs'>
    <p class="border-t border border-gray-700 border-dashed pt-2">Proposal type: <span class="capitalize text-black dark:text-white float-right font-bold">{processHeader()}</span></p>
    <p class="border-t border border-gray-700 border-dashed pt-2">Fees paid in: <span class="capitalize text-black dark:text-white float-right font-bold">{feeAsset()}</span></p>
    <p class="border-t border border-gray-700 border-dashed pt-2">Network: <span class="capitalize text-black dark:text-white float-right font-bold">{networkName() || '--'}</span></p>
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
    <Show when={maybeProposal()?.proposalType !== ProposalType.LocalTransfer}>
      <input
        type='text'
        class={`${ INPUT_COMMON_STYLE } mt-2`}
        placeholder='Add message (optional)'
        value={message()}
        onInput={e => {
          setMessage(e.currentTarget.value);
        }}
      />
    </Show>
    <button type="button" class="dark:bg-saturn-purple bg-saturn-purple rounded-md p-3 mb-4 hover:bg-purple-800 dark:hover:bg-purple-800 focus:outline-none text-sm mt-2" onClick={() => proposeCall({ preview: false, selectedAccountContext, saturnContext, proposeContext, message, feeAsset: () => feeAsset() as unknown as FeeAsset, ringApisContext, modalContext, toast })}>Submit Proposal</button>
  </div>;

  return <>
    {/* <ConnectButton /> */}
    <div id={PROPOSE_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
      <div id="proposeModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1" />
      <div class={`relative px-4 bg-saturn-offwhite dark:bg-black border border-gray-900 rounded-md w-full m-5 md:m-auto`}>
        <div class="flex flex-row grow-1 items-start justify-between gap-10 p-4">
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
        <ModalBody></ModalBody>
      </div>
    </div>
  </>;
}
