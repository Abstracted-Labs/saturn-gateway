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
    Input,
    Select,
    SelectTrigger,
    SelectPlaceholder,
    SelectValue,
    SelectTag,
    SelectTagCloseButton,
    SelectIcon,
    SelectContent,
    SelectListbox,
    SelectOptGroup,
    SelectLabel,
    SelectOption,
    SelectOptionText,
    SelectOptionIndicator,
} from "@hope-ui/solid";
import { ApiPromise } from "@polkadot/api";
import type { Call } from "@polkadot/types/interfaces";

import FormattedCall from "../components/FormattedCall";

export type TransferModalProps = {
    open: boolean;
    setOpen: Setter<boolean>;
    saturn: Saturn | undefined;
    multisigId: number | undefined;
    ringApis: { [chain: string]: ApiPromise } | undefined;
    network: string;
    asset: string;
};

export default function ProposeModal(props: TransferModalProps) {
    const [amount, setAmount] = createSignal<number>(0);
    const [possibleNetworks, setPossibleNetworks] = createSignal<string[]>([])

    createEffect(() => {});

    return (
        <Modal opened={props.open} onClose={() => props.setOpen(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton />
                <ModalHeader>Propose Asset Transfer</ModalHeader>
                <ModalBody>
                    <div class="flex flex-col gap-1">
                        <div class="flex flex-row">
                            <Select>
                                <SelectTrigger>
                                    <SelectPlaceholder>A</SelectPlaceholder>
                                    <SelectValue />
                                    <SelectIcon />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectListbox>
                                        <For each={["React", "Angular", "Vue", "Svelte", "Solid"]}>
                                            {item => (
                                                <SelectOption value={item}>
                                                    <SelectOptionText>{item}</SelectOptionText>
                                                    <SelectOptionIndicator />
                                                </SelectOption>
                                            )}
                                        </For>
                                    </SelectListbox>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger>
                                    <SelectPlaceholder>B</SelectPlaceholder>
                                    <SelectValue />
                                    <SelectIcon />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectListbox>
                                        <For each={["React", "Angular", "Vue", "Svelte", "Solid"]}>
                                            {item => (
                                                <SelectOption value={item}>
                                                    <SelectOptionText>{item}</SelectOptionText>
                                                    <SelectOptionIndicator />
                                                </SelectOption>
                                            )}
                                        </For>
                                    </SelectListbox>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            placeholder="Optional message"
                            value={amount()}
                            onInput={(e) => {
                                const a = parseInt(e.currentTarget.value);
                                if (typeof a == "number" ) setAmount(a);
                            }}
                        />
                        <Button onClick={() => {} }>Propose</Button>
                        <Button onClick={() => {} }>Cancel</Button>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={() => props.setOpen(false)}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
