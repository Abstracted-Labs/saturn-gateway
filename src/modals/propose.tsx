import { createSignal, Show, type Setter } from 'solid-js';
import { type Saturn } from '@invarch/saturn-sdk';
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
} from '@hope-ui/solid';
import { type ApiPromise } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';

import FormattedCall from '../components/FormattedCall';

export type ProposeModalProps = {
	open: boolean;
	setOpen: Setter<boolean>;
	saturn: Saturn | undefined;
	account: Account | undefined;
	multisigId: number | undefined;
	signer: Signer | undefined;
	call: Uint8Array | undefined;
	ringApis: Record<string, ApiPromise> | undefined;
};

export default function ProposeModal(props: ProposeModalProps) {
	const [message, setMessage] = createSignal<string>('');

	const propose = async () => {
		if (!props.saturn || !props.account || typeof props.multisigId !== 'number' || !props.signer || !props.call) {
			return;
		}

		const msg = message();

		let proposalMetadata;

		if (msg) {
			proposalMetadata = JSON.stringify({ message: msg });
		}

		const result = await props.saturn
			.buildMultisigCall({ id: props.multisigId, call: props.call, proposalMetadata })
			.signAndSend(props.account.address, props.signer);

		props.setOpen(false);
	};

	const cancel = () => {
		props.setOpen(false);
	};

	const showCall = () => {
      const call = props.call as Uint8Array;
      const id = props.multisigId as number;
      const ringApis = props.ringApis as Record<string, ApiPromise>;

			console.log('call: ', u8aToHex(call));

		  return <FormattedCall
			           fullCall={true}
			           call={ringApis.tinkernet.createType('Call', props.saturn?.buildMultisigCall({ id, call }).call)}
			           ringApis={props.ringApis} />;
	};

	return (
		  <Modal opened={props.open} onClose={() => {
			    cancel();
		  }}>
			    <ModalOverlay />
			    <ModalContent>
				      <ModalCloseButton />
				      <ModalHeader>Propose Multisig Call</ModalHeader>
				      <ModalBody>
					        <div class='flex flex-col gap-1'>
                      <Show when={props.call && props.saturn && typeof props.multisigId === 'number' && props.ringApis?.tinkernet}>
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
