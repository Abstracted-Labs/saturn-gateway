import { createSignal, Show, type Setter } from 'solid-js';
import { type Saturn, type MultisigCall } from '@invarch/saturn-sdk';
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
import { SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";

import { useProposeContext } from "../providers/proposeProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import FormattedCall from '../components/FormattedCall';

export type ProposeModalProps = {
	account: Account | undefined;
	signer: Signer | undefined;
};

export default function ProposeModal(props: ProposeModalProps) {
	const [message, setMessage] = createSignal<string>('');

    const [proposeContext, { closeProposeModal }] = useProposeContext();
    const saturnContext = useSaturnContext();

	  const propose = async () => {
		    if (!saturnContext.state.saturn || !props.account || typeof saturnContext.state.multisigId !== 'number' || !props.signer || !proposeContext.proposalCall) {
			      return;
		}

		  const msg = message();

		  let proposalMetadata;

		if (msg) {
			proposalMetadata = JSON.stringify({ message: msg });
		}

      try {
          const call = proposeContext.proposalCall as Uint8Array;

          await saturnContext.state.saturn
			                       .buildMultisigCall({ id: saturnContext.state.multisigId, call, proposalMetadata })
			                       .signAndSend(props.account.address, props.signer);
      } catch {
          try {
              const call = proposeContext.proposalCall as MultisigCall;

              await call.signAndSend(props.account.address, props.signer);
          } catch {}
      } finally {
          closeProposeModal();
      }
	  };

	const cancel = () => {
		  closeProposeModal();
	};

	  const showCall = (call: SubmittableExtrinsic<ApiTypes>) => {
        return <FormattedCall
			             fullCall={true}
			             call={call}
			         />;
	  };

    const a = () => {
        const id = saturnContext.state.multisigId as number;
        const sat = saturnContext.state.saturn as Saturn;

        try {
            const call = proposeContext.proposalCall as Uint8Array;

            return showCall(sat.buildMultisigCall({ id, call }).call)
        } catch {
            const call = proposeContext.proposalCall as MultisigCall;

            return showCall(call.call)
        }
    };

	return (
		  <Modal opened={!!proposeContext.proposalCall} onClose={() => {
			    cancel();
		  }}>
			    <ModalOverlay />
			    <ModalContent>
				      <ModalCloseButton />
				      <ModalHeader>Propose Multisig Call</ModalHeader>
				      <ModalBody>
					        <div class='flex flex-col gap-1'>
                      <Show when={proposeContext.proposalCall && saturnContext.state.saturn && typeof saturnContext.state.multisigId === 'number'}>
						              {a()}
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
