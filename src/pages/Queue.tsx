import { createSignal, For, createEffect, Show } from 'solid-js';
import {
    Accordion, AccordionItem, AccordionButton, AccordionIcon, AccordionPanel,
    Text,
    Button,
    Switch,
    Progress, ProgressIndicator, ProgressLabel,
    CircularProgress, CircularProgressIndicator, CircularProgressLabel,
} from '@hope-ui/solid';
import { type Saturn, type CallDetailsWithHash, type ParsedTallyRecordsVote, type MultisigDetails } from '@invarch/saturn-sdk';
import { BN } from '@polkadot/util';
import type { Signer } from '@polkadot/types/types';
import type { AnyJson } from '@polkadot/types/types/codec';
import type { Call } from '@polkadot/types/interfaces';
import { type ApiPromise } from '@polkadot/api';
import { FaSolidCircleCheck, FaSolidCircleXmark } from 'solid-icons/fa';

import { useRingApisContext } from "../providers/ringApisProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { Rings } from '../data/rings';
import FormattedCall from '../components/FormattedCall';

export type QueuePageProps = {
};

export default function Queue() {
    const [pendingProposals, setPendingProposals] = createSignal<CallDetailsWithHash[]>([]);
    const [viewFullCall, setViewFullCall] = createSignal<boolean>(false);

    const ringApisContext = useRingApisContext();
    const saturnContext = useSaturnContext();
    const selectedAccountContext = useSelectedAccountContext();

    createEffect(() => {
        const runAsync = async () => {
            if (!saturnContext.state.saturn || typeof saturnContext.state.multisigId !== 'number') {
                return;
            }

            const pendingCalls = await saturnContext.state.saturn.getPendingCalls(saturnContext.state.multisigId);

            setPendingProposals(pendingCalls);
        };

        runAsync();
    });

    const vote = async (callHash: string, aye: boolean) => {
        if (!saturnContext.state.saturn || !selectedAccountContext.state.selectedAccount || typeof saturnContext.state.multisigId !== 'number' || !selectedAccountContext.state.selectedWallet?.signer) {
            return;
        }

        const result = await saturnContext.state.saturn.vote({
            id: saturnContext.state.multisigId,
            callHash,
            aye,
        }).signAndSend(selectedAccountContext.state.selectedAccount.address, { signer: selectedAccountContext.state.selectedWallet.signer });

        console.log('result: ', result);
    };

    const processCallDescription = (call: Call): string => {
        switch (call.method) {
            case 'sendCall':
                const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
                const innerCall = (call.toHuman().args as Record<string, AnyJson>).call?.toString();

                if (!chain || !innerCall || !ringApisContext.state[chain]) {
                    return '';
                }

                const xcmCall = ringApisContext.state[chain].createType('Call', innerCall);

                return `Execute ${xcmCall.section}.${xcmCall.method} call`;

            default:
                return `Execute ${call.section}.${call.method} call`;
        }
    };

    const processNetworkIcons = (call: Call): string[] => {
        switch (call.method) {
            case 'sendCall':
                const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
                if (!chain) {
                    return [];
                }

                const ring = JSON.parse(JSON.stringify(Rings))[chain];

                return [ring.icon];

            default:
                return [Rings.tinkernet.icon];
        }
    };

    const processExternalCall = (fullCall: Call, call: string): Record<string, AnyJson> | string => {
        console.log('call: ', call);

        const chain = (fullCall.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();

        if (!chain || ringApisContext.state[chain]) {
            return call;
        }

        const objectOrder = {
            section: null,
            method: null,
            args: null,
        };

        return Object.assign(objectOrder, ringApisContext.state[chain].createType('Call', call).toHuman());
    };

    const processSupport = (ayes: BN): number => {
        if (!saturnContext.state.multisigDetails) {
            return 0;
        }

        const totalSupply = saturnContext.state.multisigDetails.totalIssuance;

        return new BN(ayes).mul(new BN('100')).div(totalSupply).toNumber();
    };

    const processApprovalAye = (ayes: BN, nays: BN): number => new BN(ayes).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

    const processApprovalNay = (ayes: BN, nays: BN): number => new BN(nays).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

    return (
        <Accordion>
            <For each={pendingProposals()}>
                {(pc: CallDetailsWithHash) => <AccordionItem>
                    <h2>
                        <AccordionButton class='ps-0'>
                            <div class='flex px-2 gap-1'>
                                <For each={processNetworkIcons(pc.details.actualCall)}>
                                    {(icon: string) =>
                                        <div class='flex items-center justify-center h-6 w-6 rounded-full border border-white'>
                                            <img src={icon} class='max-h-5 rounded-full' />
                                        </div>
                                    }</For>
                            </div>
                            <Text flex={1} fontWeight='$medium' textAlign='start'>
                                {processCallDescription(pc.details.actualCall)}
                            </Text>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel>
                        <div class='flex flex-row divide-x'>
                            <div class='px-1 basis-5/6 max-w-[83%]'>
                                <Show when={pc.details.actualCall.toHuman().method == 'sendCall'}>
                                    <Switch defaultChecked={false} onChange={e => setViewFullCall(!viewFullCall())}>View Full Call</Switch>
                                </Show>
                                <FormattedCall fullCall={viewFullCall()} call={pc.details.actualCall} />
                                <div class='flex flex-row pt-2.5'>
                                    <div class='w-[70%] pr-3'>
                                        <Progress height='24px' width='100%' value={processSupport(pc.details.tally.ayes)}>
                                            <ProgressIndicator color='#D55E8A'>
                                                <ProgressLabel fontSize='15px' />
                                            </ProgressIndicator>
                                        </Progress>
                                        Support needed: {saturnContext.state.multisigDetails?.minimumSupport.toHuman() || 'Error'}
                                    </div>
                                    <div>
                                        <div style={{ position: 'relative' }}>
                                            <CircularProgress
                                                style={{ position: 'absolute', top: '0', left: '0' }}
                                                value={processApprovalAye(pc.details.tally.ayes, pc.details.tally.nays)}
                                                trackColor='rgba(0,0,0,0)'
                                            >
                                                <CircularProgressIndicator class='-scale-x-100 -scale-y-100' color='$success9' />
                                                <CircularProgressLabel />
                                            </CircularProgress>
                                            <CircularProgress value={processApprovalNay(pc.details.tally.ayes, pc.details.tally.nays)} trackColor='rgba(0,0,0,0)' >
                                                <CircularProgressIndicator class='-scale-y-100' color='#f2828d' />
                                            </CircularProgress>
                                        </div>
                                        Approval needed: {saturnContext.state.multisigDetails?.requiredApproval.toHuman() || 'Error'}
                                    </div>
                                </div>
                                <div class='flex gap-2'>
                                    <Button class='bg-[#D55E8A] hover:bg-[#E40C5B]' onClick={() => vote(pc.callHash.toString(), true)}>Aye</Button>
                                    <Button class='bg-[#D55E8A] hover:bg-[#E40C5B]' onClick={() => vote(pc.callHash.toString(), false)}>Nay</Button>
                                </div>
                            </div>
                            <div class='px-1 basis-1/6 max-w-[16%]'>
                                <div>
                                    <div class='flow-root'>
                                        <ul class='-mb-8'>
                                            <For each={Object.entries(pc.details.tally.records)}>
                                                {([voter, vote]: [string, ParsedTallyRecordsVote]) =>
                                                    <li>
                                                        <div class='relative pb-8'>
                                                            <div class='relative flex space-x-3'>
                                                                <div class='flex h-8 w-8 items-center justify-center rounded-full'>
                                                                    {vote.aye
                                                                        ? <FaSolidCircleCheck size={24} color='#8fb9a8' />
                                                                        : <FaSolidCircleXmark size={24} color='#f2828d' />
                                                                    }
                                                                </div>
                                                                <div class='flex min-w-0 flex-1 justify-between space-x-4 pt-1.5'>
                                                                    <div>
                                                                        <p class='text-sm text-gray-400'>
                                                                            <span
                                                                                class='font-medium text-gray-200'
                                                                            >
                                                                                {voter.substr(0, 4) + '...' + voter.substr(voter.length - 4, voter.length)}
                                                                            </span>
                                                                            {` voted ${vote.aye ? 'aye' : 'nay'} with ${new BN(vote.aye?.toString() || vote.nay?.toString() || '0').div(new BN('1000000')).toString()} votes`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                }</For>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AccordionPanel>
                </AccordionItem>
                }</For>
        </Accordion>
    );
}
