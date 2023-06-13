import { createSignal, Show, type Setter } from 'solid-js';
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
import { u8aToHex } from "@polkadot/util";

import { useProposeContext } from "../providers/proposeProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import { useRingApisContext } from "../providers/ringApisProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import FormattedCall from '../components/FormattedCall';

export type ProposeModalProps = {};

export default function ProposeModal() {
	  const [message, setMessage] = createSignal<string>('');
    const [feeAsset, setFeeAsset] = createSignal<FeeAsset>(FeeAsset.TNKR);

    const ringApisContext = useRingApisContext();
    const proposeContext = useProposeContext();
    const saturnContext = useSaturnContext();
    const selectedAccountContext = useSelectedAccountContext();

	  const propose = async () => {
		    if (!saturnContext.state.saturn || !selectedAccountContext.state.selectedAccount || typeof saturnContext.state.multisigId !== 'number' || !selectedAccountContext.state.selectedWallet?.signer || !proposeContext.state.proposalCall) {
			      return;
		}

		  const msg = message();

		  let proposalMetadata;

		if (msg) {
			proposalMetadata = JSON.stringify({ message: msg });
		}

        const call = proposeContext.state.proposalCall;

        await saturnContext.state.saturn
			                     .buildMultisigCall({ id: saturnContext.state.multisigId, call, proposalMetadata, feeAsset: feeAsset() })
			                     .signAndSend(selectedAccountContext.state.selectedAccount.address, selectedAccountContext.state.selectedWallet.signer);

        proposeContext.setters.closeProposeModal();
	  };

	const cancel = () => {
		  proposeContext.setters.closeProposeModal();
	};

    const showCall = () => {
        const call = proposeContext.state.proposalCall as Uint8Array;
        const chain = proposeContext.state.chain as string;

        return <FormattedCall
			             fullCall={false}
			             call={ringApisContext.state[chain].createType("Call", call) as unknown as Call}
			         />;
    };

	  return (
		    <Modal opened={!!proposeContext.state.proposalCall} onClose={() => {
			      cancel();
		    }}>
			      <ModalOverlay />
			      <ModalContent>
				        <ModalCloseButton />
				        <ModalHeader>Propose Multisig Call</ModalHeader>
				        <ModalBody>
					          <div class='flex flex-col gap-1'>
                        <div class="flex flex-row gap-2">
                            <Switch
                                checked={feeAsset() != FeeAsset.TNKR }
                                onChange={() => feeAsset() === FeeAsset.TNKR ? setFeeAsset(FeeAsset.KSM) : setFeeAsset(FeeAsset.TNKR)}
                            >TNKR</Switch>
                            <span>KSM</span>
                        </div>
                        <p>Network: <span class="capitalize">{proposeContext.state.chain}</span></p>
                        <Show when={!!proposeContext.state.proposalCall && proposeContext.state.chain}>
						                {showCall()}
                        </Show>
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
