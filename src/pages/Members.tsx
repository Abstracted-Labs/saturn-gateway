import type { Setter } from 'solid-js';
import { createSignal, For, createEffect, Show } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { type ApiPromise } from '@polkadot/api';
import { type Saturn } from '@invarch/saturn-sdk';

export type MembersPageProps = {
    multisigId: number | undefined;
    multisigAddress: string | undefined;
    saturn: Saturn | undefined;
    ringApis: Record<string, ApiPromise> | undefined;
    setProposeModalOpen: Setter<boolean>;
    setCurrentCall: Setter<Uint8Array>;
};

export default function Members(props: MembersPageProps) {}
