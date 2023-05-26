import type { Component, Accessor } from 'solid-js';
import { createSignal, onMount, For, createEffect, Show } from "solid-js";
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Button
} from "@hope-ui/solid";
import { BN } from "@polkadot/util";
import { getBalancesFromAllNetworks, NetworkBalances } from "../utils/getBalances";
import { Rings } from "../data/rings";
import { useSearchParams } from "@solidjs/router";
import { BigNumber } from "bignumber.js";
import { ApiPromise } from "@polkadot/api";
import { Saturn } from "@invarch/saturn-sdk";

import styles from '../App.module.css';
import TransferModal from "../modals/transfer";

export type AssetsPageProps = {
    multisigId: number | undefined;
    address: string | undefined;
    saturn: Saturn | undefined;
    ringApis: { [chain: string]: ApiPromise } | undefined;
};

const StakePage = {
    tinkernet_TNKR: "https://tinker.network/staking",
}

export default function Assets(props: AssetsPageProps) {
    const [balances, setBalances] = createSignal<[string, [string, {
        freeBalance: string;
        reservedBalance: string;
        frozenFee: string;
        totalBalance: string;
    }][]][] | null>(null);

    const [transferModalOpen, setTransferModalOpen] = createSignal<boolean>(false);

    createEffect(async () => {

        console.log(props.address)
        console.log(props.multisigId)

        const id = props.multisigId;
        const address = props.address;
        if (typeof id != "number" || !address) return;

        const nb = await getBalancesFromAllNetworks(address);

        const remapped = Object.entries(nb).map(([key, value]) => {
            const ret: [string, [string, {
                freeBalance: string;
                reservedBalance: string;
                frozenFee: string;
                totalBalance: string;
            }][]] = [key,
                    Object.entries(value)
                        .map(([asset, assetBalances]) => {
                            const ret: [string, {
                                freeBalance: string;
                                reservedBalance: string;
                                frozenFee: string;
                                totalBalance: string;
                            }] = [asset, assetBalances as unknown as {
                                freeBalance: string;
                                reservedBalance: string;
                                frozenFee: string;
                                totalBalance: string;
                            }];

                            return ret;
                        })
                        .filter(([asset, assetBalances]) => {
                            return assetBalances.freeBalance != "0" ||
                                assetBalances.reservedBalance != "0" ||
                                assetBalances.frozenFee != "0" ||
                                assetBalances.totalBalance != "0";
                        })
                ];

            return ret;
        });

        setBalances(remapped);
    });

    return (
        <>
        <TransferModal
        open={transferModalOpen()}
        setOpen={setTransferModalOpen}
        saturn={props.saturn}
        ringApis={props.ringApis}
        multisigId={props.multisigId}
        />

        <div class="flex flex-col gap-4">
            {balances() ? (

                <For each={balances()}>{([network, assets]) =>
                    <Show when={assets.length}>
                        <div class="border border-[#D55E8A] shadow-sm rounded-lg overflow-hidden w-[60%] mx-auto">
                            <table class="w-full text-sm leading-5">
                                <thead class="bg-[#D55E8A]">
                                    <tr>
                                        <th>
                                            <div class="flex flex-row gap-1 items-center px-2.5 py-2">
                                                <div class="h-7 w-7 rounded-full border border-white">
                                                    <img src={Rings[network as keyof typeof Rings].icon} class="h-full w-full p-px rounded-full" />
                                                </div>
                                                <span class="capitalize text-lg">
                                                    {network}
                                                </span>
                                            </div>
                                        </th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </tr>
                                    <tr>
                                        <th class="py-3 px-4 text-left font-medium text-white w-[20%]">Asset</th>
                                        <th class="py-3 px-4 text-left font-medium text-white w-[20%]">Transferable</th>
                                        <th class="py-3 px-4 text-left font-medium text-white w-[20%]">Total</th>
                                        <th class="w-[40%]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={assets}>{([asset, b]) =>
                                        <tr>
                                            <td class="py-3 px-4 text-left font-medium text-white w-[20%]">{asset}</td>
                                            <td class="py-3 px-4 text-left w-[20%]">{
                                                BigNumber(b.totalBalance).minus(
                                                    BigNumber(b.reservedBalance)
                                                ).minus(
                                                    BigNumber(b.frozenFee)
                                                ).div(
                                                    BigNumber("10").pow(
                                                        BigNumber(Rings[network as keyof typeof Rings].decimals)
                                                    )
                                                ).toFixed(2).toString()
                                            } {asset}</td>
                                            <td class="w-[20%]">{
                                                BigNumber(b.totalBalance).div(
                                                    BigNumber("10").pow(
                                                        BigNumber(Rings[network as keyof typeof Rings].decimals)
                                                    )
                                                ).toFixed(2).toString()
                                            } {asset}</td>
                                            <td class="flex gap-2.5 w-[40%] py-2">
                                                <Button onClick={() => setTransferModalOpen(true) } class="bg-[#D55E8A] hover:bg-[#E40C5B]">Transfer</Button>

                                                <Show when={StakePage[`${network}_${asset}` as keyof typeof StakePage]}>
                                                    <form action={StakePage[`${network}_${asset}` as keyof typeof StakePage]} target="_blank">
                                                        <Button type="submit" class="bg-[#D55E8A] hover:bg-[#E40C5B]">Stake</Button>
                                                    </form>
                                                </Show>
                                            </td>
                                        </tr>
                                    }</For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                }</For>

            ) : null}
        </div>
        </>

        /* <div class={styles.assetsPanel}>
           <div class={styles.assetsPanelHeader}>
           <p class={styles.assetsPanelHeaderText}>Assets</p>
           </div>
           <Table>
           <Thead>
           <Tr>
           <Th>Asset</Th>
           <Th>Transferable</Th>
           <Th>Total</Th>
           <Th>Network</Th>
           <Th></Th>
           <Th></Th>
           </Tr>
           </Thead>
           <Tbody>

           {balances() ? (
           <>
           <For each={balances()}>{([network, assets], i) =>
           <>
           <For each={assets}>{([asset, b], i) =>
           <Tr>
           <Td>{asset}</Td>
           <Td>{
           (new BN(b.totalBalance).sub(
           new BN(b.reservedBalance)).sub(
           new BN(b.frozenFee)))
           .div(new BN("10")
           // eslint-disable-next-line @typescript-eslint/ban-ts-comment
           // @ts-ignore
           .pow(new BN(Rings[network].decimals))
           )
           .toString()
           } {asset}</Td>
           <Td>{new BN(b.totalBalance)
           .div(new BN("10")
           // eslint-disable-next-line @typescript-eslint/ban-ts-comment
           // @ts-ignore
           .pow(new BN(Rings[network].decimals))
           )
           .toString()} {asset}</Td>
           <Td>{network.charAt(0).toUpperCase() + network.slice(1)}</Td>
           <Td></Td>
           <Td></Td>
           </Tr>
           }</For>
           </>
           }</For>
           </>
           ) : null}

           </Tbody>
           </Table>

           </div> */
    );
};
