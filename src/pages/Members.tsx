import type { Setter } from 'solid-js';
import { createSignal, For, createEffect, Show, Suspense, lazy, createResource } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { type ApiPromise } from '@polkadot/api';
import { type Saturn } from '@invarch/saturn-sdk';

import { useSaturnContext } from "../providers/saturnProvider";
import TalismanIdenticon from '../components/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../utils/identityProcessor";

const getIdentities = async (members: { address: string }[]) => {
    const identityList = await Promise.all(members.map((member) => getBestIdentity(member.address)));

    const identityObj = identityList.reduce((o, identity) => ({ ...o, [identity.address]: identity }), {});

    return identityObj;
}

export default function Members() {
    const [members, setMembers] = createSignal<{ address: string, votes: BigNumber }[]>([]);
    const [identities, { mutate, refetch }] = createResource<{ [address: string]: AggregatedIdentity }, { address: string, votes: BigNumber }[]>(members, getIdentities);

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
        <div class='border border-[#D55E8A] shadow-sm rounded-lg overflow-hidden mx-auto w-fit'>
            <table class='w-full text-sm leading-5'>
                <thead class='bg-[#D55E8A]'>
                    <tr>
                        <th class='py-3 px-4 text-left font-medium text-white'>Member</th>
                        <th class='py-3 px-4 text-left font-medium text-white'>Votes</th>
                        <th class=""/>
                    </tr>
                </thead>
                <tbody>
                    <For each={members()}>
                        {(member) =>
                            <tr>
                                <td class='py-3 px-4 h-full text-left font-medium text-white'>
                                    <div class="flex flex-row gap-2.5 items-center">
                                        <Suspense fallback={
                                            <>
                                                <TalismanIdenticon value={member.address} size={40} />
                                                                         {member.address}
                                            </>
                                        }>
                                            <Show
                                                when={identities()?.[member.address]?.image?.value}
                                                fallback={
                                                    <TalismanIdenticon value={member.address} size={40} />
                                                }
                                            >
                                                <img class="h-[40px] w-[40px] rounded-full"
                                                    src={identities()?.[member.address]?.image?.value}
                                                />
                                            </Show>

                                            { identities()?.[member.address]?.name ? identities()?.[member.address].name : member.address }

                                        </Suspense>
                                    </div>
                                </td>
                                <td class='py-3 px-4 h-full text-left'>
                                    {member.votes.div("1000000").decimalPlaces(2, 1).toString()}
                                </td>
                                <td class='py-3 px-4 h-full'>
                                    <div class="flex flex-row gap-2.5">
                                        <Button onClick={() => {}} class='bg-[#D55E8A] hover:bg-[#E40C5B]'>Give More Votes</Button>
                                        <Button onClick={() => {}} class='bg-[#D55E8A] hover:bg-[#E40C5B]'>Remove Votes</Button>
                                    </div>
                                </td>
                            </tr>
                        }</For>
                </tbody>
            </table>
        </div>
    )
}
