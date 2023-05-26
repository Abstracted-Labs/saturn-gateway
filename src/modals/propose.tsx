import type { Component } from 'solid-js';
import { lazy, onMount, createSignal, Show, For, createEffect, Setter } from 'solid-js';
import { Saturn } from "@invarch/saturn-sdk";
import { Account } from '@polkadot-onboard/core';
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
    Input
} from "@hope-ui/solid";
import { ApiPromise } from "@polkadot/api";
import type { Call } from "@polkadot/types/interfaces";

import FormattedCall from "../components/FormattedCall";

export type ProposeModalProps = {
    open: boolean;
    setOpen: Setter<boolean>;
    saturn: Saturn | undefined;
    account: Account | undefined;
    multisigId: number | undefined;
    signer: Signer | undefined;
    call: Uint8Array | undefined;
    ringApis: { [chain: string]: ApiPromise } | undefined;
};

export default function ProposeModal(props: ProposeModalProps) {
    const [message, setMessage] = createSignal<string>("");

    const propose = async () => {
        if (!props.saturn || !props.account || typeof props.multisigId != "number" || !props.signer || !props.call) return;

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
        if (!props.call || !props.saturn || typeof props.multisigId != "number" || !props.ringApis?.["tinkernet"]) return;

           return <FormattedCall
                fullCall={true}
                call={props.ringApis["tinkernet"].createType("Call", props.saturn?.buildMultisigCall({ id: props.multisigId, call: props.call }).call)}
                ringApis={props.ringApis} />;
    }


    return (
        <Modal opened={props.open} onClose={() => props.setOpen(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton />
                <ModalHeader>Propose Multisig Call</ModalHeader>
                <ModalBody>
                    <div class="flex flex-col gap-1">
                        {showCall()}
                        <Input
                            placeholder="Optional message"
                            value={message()}
                            onInput={(e) => {
                                setMessage(e.currentTarget.value);
                            }}
                        />
                        <Button onClick={() => propose() }>Propose</Button>
                        <Button onClick={() => cancel() }>Cancel</Button>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={() => props.setOpen(false)}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
