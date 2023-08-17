import { createSignal, Show, type Setter, Match, Switch as SolidSwitch } from 'solid-js';
import { type Saturn, type MultisigCall, FeeAsset } from '@invarch/saturn-sdk';
import { type Account } from '@polkadot-onboard/core';
import type { Signer } from '@polkadot/types/types';
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Input,
  Switch,
  Text,
} from '@hope-ui/solid';
import { type ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";
import type { AnyJson } from '@polkadot/types/types/codec';
import type { Call } from '@polkadot/types/interfaces';
import { u8aToHex, BN } from "@polkadot/util";
import { BigNumber } from 'bignumber.js';

import { useProposeContext, ProposalType } from "../providers/proposeProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import { useRingApisContext } from "../providers/ringApisProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import FormattedCall from '../components/legos/FormattedCall';
import { RingAssets } from "../data/rings";

type TransferProposalProps = {
  amount: BN | BigNumber | string;
  asset: string;
  to: string;
};

function TransferProposal(props: TransferProposalProps) {
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
}

type CallProposalProps = {
  encodedCall: Uint8Array;
  chain: string;
};

function CallProposal(props: CallProposalProps) {
  const ringApisContext = useRingApisContext();

  return <FormattedCall
    call={ringApisContext.state[props.chain].createType("Call", props.encodedCall) as unknown as Call}
  />;
}

export type ProposeModalProps = {};

export default function ProposeModal() {
  const [message, setMessage] = createSignal<string>('');
  const [feeAsset, setFeeAsset] = createSignal<FeeAsset>(FeeAsset.TNKR);

  const ringApisContext = useRingApisContext();
  const proposeContext = useProposeContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();

  const propose = async () => {
    const selected = selectedAccountContext.state;

    if (!saturnContext.state.saturn || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number' || !proposeContext.state.proposal) {
      return;
    }

    const msg = message();

    let proposalMetadata;

    if (msg) {
      proposalMetadata = JSON.stringify({ message: msg });
    }

    const proposalData = proposeContext.state.proposal.data;
    const proposalType = proposeContext.state.proposal.proposalType;

    console.log("data, type: ", proposalData, proposalType);

    if (proposalType === ProposalType.LocalCall && (proposalData as { encodedCall: Uint8Array; }).encodedCall) {
      await saturnContext.state.saturn
        .buildMultisigCall({
          id: saturnContext.state.multisigId,
          call: (proposalData as { encodedCall: Uint8Array; }).encodedCall,
          proposalMetadata,
          feeAsset: feeAsset()
        })
        .signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
    } else if (
      proposalType === ProposalType.XcmCall &&
      (proposalData as { encodedCall: Uint8Array; }).encodedCall &&
      (proposalData as { chain: string; }).chain
    ) {

      console.log("in xcmcall");

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
    } else if (
      proposalType === ProposalType.XcmTransfer &&
      (proposalData as { amount: BN | BigNumber | string; }).amount &&
      (proposalData as { to: string; }).to &&
      (proposalData as { asset: string; }).asset &&
      (proposalData as { chain: string; }).chain
    ) {

      const chain = (proposalData as { chain: string; }).chain;
      const amount = (proposalData as { amount: BN | BigNumber | string; }).amount;
      const to = (proposalData as { to: string; }).to;
      const asset = (proposalData as { asset: string; }).asset;

      const xcmAsset = saturnContext.state.saturn.chains.find((c) => c.chain.toLowerCase() == chain)?.assets.find((a) => a.label == asset)?.registerType;

      if (!xcmAsset || !saturnContext.state.multisigAddress) return;

      const { partialFee } = await ringApisContext.state[chain].tx.balances.transfer(to, new BN(amount.toString())).paymentInfo(saturnContext.state.multisigAddress);

      await saturnContext.state.saturn
        .transferXcmAsset({
          id: saturnContext.state.multisigId,
          asset: xcmAsset,
          amount: new BN(amount.toString()),
          to,
          xcmFeeAsset: xcmAsset,
          xcmFee: new BN(partialFee).mul(new BN("2")),
          proposalMetadata,
        })
        .signAndSend(selected.account.address, selected.wallet.signer, feeAsset());
    }

    // TODO: Implement LocalTransfer and XcmBridge.

    proposeContext.setters.closeProposeModal();
  };

  const cancel = () => {
    proposeContext.setters.closeProposeModal();
  };

  const maybeProposal = proposeContext.state.proposal;

  const processHeader = (): string => {
    switch (maybeProposal?.proposalType) {
      default:
        return "Call";

      case ProposalType.LocalTransfer:
        return "Balance Transfer";

      case ProposalType.XcmTransfer:
        return "Balance Transfer";

      case ProposalType.LocalCall:
        return "Call";

      case ProposalType.XcmCall:
        return "Call";

      case ProposalType.XcmBridge:
        return "Asset Bridge";
    }
  };

  return (
    <Modal size="2xl" opened={!!proposeContext.state.proposal} onClose={() => {
      cancel();
    }}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Propose Multisig {processHeader()}</ModalHeader>
        <ModalBody>
          <div class='flex flex-col gap-1'>
            <div class="flex flex-row gap-2">
              <Switch
                checked={feeAsset() != FeeAsset.TNKR}
                onChange={() => feeAsset() === FeeAsset.TNKR ? setFeeAsset(FeeAsset.KSM) : setFeeAsset(FeeAsset.TNKR)}
              >TNKR</Switch>
              <span>KSM</span>

            </div>
            <p>Network: <span class="capitalize">{proposeContext.state.proposal?.data.chain}</span></p>

            <SolidSwitch>
              <Match when={
                proposeContext.state.proposal?.proposalType === ProposalType.LocalCall ||
                proposeContext.state.proposal?.proposalType === ProposalType.XcmCall
              }>
                {
                  maybeProposal &&
                  (maybeProposal?.data as { encodedCall: Uint8Array; }).encodedCall &&
                  (maybeProposal?.data as { chain: string; }).chain &&
                  (<CallProposal
                    encodedCall={(maybeProposal.data as { encodedCall: Uint8Array; }).encodedCall}
                    chain={(maybeProposal.data as { chain: string; }).chain}
                  />)
                }
              </Match>
              <Match when={
                proposeContext.state.proposal?.proposalType === ProposalType.LocalTransfer ||
                proposeContext.state.proposal?.proposalType === ProposalType.XcmTransfer
              }>
                {
                  maybeProposal &&
                  (maybeProposal?.data as { amount: BN | BigNumber | string; }).amount &&
                  (maybeProposal?.data as { asset: string; }).asset &&
                  (maybeProposal?.data as { to: string; }).to &&
                  (<TransferProposal
                    amount={(maybeProposal.data as { amount: BN | BigNumber | string; }).amount}
                    asset={(maybeProposal.data as { asset: string; }).asset}
                    to={(maybeProposal.data as { to: string; }).to}
                  />)
                }
              </Match>
            </SolidSwitch>

            <Input
              placeholder='Optional message'
              value={message()}
              onInput={e => {
                setMessage(e.currentTarget.value);
              }}
            />
            <Button onClick={() => propose()}>Propose</Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => {
            cancel();
          }}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
