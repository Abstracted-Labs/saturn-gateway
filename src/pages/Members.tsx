import type { Setter } from 'solid-js';
import { createSignal, For, createEffect, Show } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { type ApiPromise } from '@polkadot/api';
import { type Saturn } from '@invarch/saturn-sdk';

import { useSaturnContext } from "../providers/saturnProvider";
import TalismanIdenticon from '../components/TalismanIdenticon';

export default function Members() {
    const [members, setMembers] = createSignal<{ address: string, votes: BigNumber }[]>([]);

    const saturnContext = useSaturnContext();

    createEffect(() => {
        const saturn = saturnContext.state.saturn;
        const multisigId = saturnContext.state.multisigId;

        if (!saturn || typeof multisigId != "number") return;

        const runAsync = async () => {
            const mems = await saturn.getMultisigMembers(multisigId);

            const memsProcessedPromise = mems.map(async (m) => {
                const votes = BigNumber((await saturn.getMultisigMemberBalance({ id: multisigId, address: m })).toString());
                return {
                    address: m.toHuman(),
                    votes,
                };
            });

            const memsProcessed = await Promise.all(memsProcessedPromise);

            setMembers(memsProcessed);
        };

        runAsync();
    });

    return (
        <div>

            <div class="max-w-sm mx-auto mt-40">
                <For each={members()}>
                    {(member) => (
                        <div class="p-3 flex items-center justify-between border-t cursor-pointer bg-black">
                            <div class="flex items-center">
                                <div class="flex h-full w-[40px]">
                                    <TalismanIdenticon value={member.address} size={40} />
                                </div>
                                <div class="ml-2 flex flex-col">
                                    <div class="leading-snug text-sm text-white font-bold">{member.address}</div>
                                    <div class="leading-snug text-xs text-white">{member.votes.div("1000000").decimalPlaces(2, 1).toString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>

        </div>
    )
}
