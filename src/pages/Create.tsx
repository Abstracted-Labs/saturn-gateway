import type { Setter } from 'solid-js';
import { createSignal, For, createEffect, Show, Suspense, lazy, createResource } from 'solid-js';
import { useNavigate } from '@solidjs/router'
import { Button, Input } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { type ApiPromise } from '@polkadot/api';
import { type Saturn, FeeAsset } from '@invarch/saturn-sdk';
import { BN } from '@polkadot/util';

import { useSaturnContext } from "../providers/saturnProvider";
import TalismanIdenticon from '../components/TalismanIdenticon';
import Identity from '../components/Identity';
import { getBestIdentity, type AggregatedIdentity } from "../utils/identityProcessor";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { useRingApisContext } from "../providers/ringApisProvider";

export default function Create() {
    const saturnContext = useSaturnContext();
    const selectedAccountContext = useSelectedAccountContext();
    const ringApisContext = useRingApisContext();

    const navigate = useNavigate();

    const [nameField, setNameField] = createSignal<string>('');
    const [minimumSupportField, setMinimumSupportField] = createSignal<string>('');
    const [requiredApprovalField, setRequiredApprovalField] = createSignal<string>('');
    const [secondMember, setSecondMember] = createSignal<string>('');

    createEffect(() => {
        const saturn = saturnContext.state.saturn;

        if (!saturn) return;

        const runAsync = async () => {};

        runAsync();
    });

    const createMultisig = async () => {
        const selected = selectedAccountContext.state;
        const saturn = saturnContext.state.saturn;
        const tinkernetApi = ringApisContext.state.tinkernet;

        console.log(selected);

        if (!saturn || !selected.account || !selected.wallet) return;

        const name = nameField();
        const requiredApproval = requiredApprovalField();
        const minimumSupport = minimumSupportField();
        const sm = secondMember();

        const { account, wallet } = selected;

        console.log(!name, !minimumSupport, !requiredApproval, !wallet.signer);

        if (!name || !minimumSupport || !requiredApproval || !wallet.signer) return;

        let ms = parseFloat(minimumSupport);
        let ra = parseFloat(requiredApproval);

        if (!ms || !ra) return;

        ms = ms * 10000000;
        ra = ra * 10000000;

        const createMultisigResult = await saturn.createMultisig({
            minimumSupport: new BN(ms),
            requiredApproval: new BN(ra),
            creationFeeAsset: FeeAsset.TNKR
        }).signAndSend(account.address, wallet.signer);

        console.log("createMultisigResult: ", createMultisigResult);

        const multisigAddress = createMultisigResult.account.toHuman();
        const multisigId = createMultisigResult.id;

        let innerCalls = [
            tinkernetApi.tx.identity.setIdentity({ display: { Raw: name } })
        ];

        if (sm) innerCalls.push(tinkernetApi.tx.inv4.tokenMint("1000000", sm));

        const calls = [
            tinkernetApi.tx.balances.transferKeepAlive(multisigAddress, new BN("7000000000000")),
            saturn.buildMultisigCall({
                id: multisigId,
                call: tinkernetApi.tx.utility.batchAll(innerCalls),
            }).call
        ];

        tinkernetApi.tx.utility.batchAll(calls).signAndSend(account.address, { signer: wallet.signer }, ({ status }) => {
            if (status.isFinalized || status.isInBlock) navigate(`/${multisigId}/members`, { resolve: false });
        });
    };

    return (
        <div class='flex justify-center items-center'>
            <div
                class="flex flex-col gap-4"
            >
                <label for="name">Multisig Name</label>
                <Input
                    value={nameField()}
                    onInput={e => {
                        setNameField(e.currentTarget.value);
                    }}
                />

                <label for="requiredApproval">Required Approval</label>
                <Input
                    value={requiredApprovalField()}
                    onInput={e => {
                        setRequiredApprovalField(e.currentTarget.value);
                    }}
                />

                <label for="requiredApproval">Minimum Support</label>
                <Input
                    value={minimumSupportField()}
                    onInput={e => {
                        setMinimumSupportField(e.currentTarget.value);
                    }}
                />

                <label for="secondMember">Second Member</label>
                <Input
                    value={secondMember()}
                    onInput={e => {
                        setSecondMember(e.currentTarget.value);
                    }}
                />

                <button
                    class="bg-[#D55E8A] hover:bg-[#E40C5B]"
                    onClick={() => createMultisig()}
                >
                    Submit
                </button>
            </div>
        </div>
    )
}
