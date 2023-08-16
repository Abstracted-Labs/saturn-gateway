import type { Setter } from 'solid-js';
import { createSignal, For, createEffect, Show } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { Rings } from '../data/rings';
import { BigNumber } from 'bignumber.js';
import { type ApiPromise } from '@polkadot/api';
import { type Saturn } from '@invarch/saturn-sdk';

import TransferModal from '../modals/transfer';
import { useSaturnContext } from "../providers/saturnProvider";
import type { AssetsBalances, Balances } from "../utils/getBalances";

export type AssetsPageProps = {
};

const StakePage = {
  tinkernet_TNKR: 'https://tinker.network/staking',
};

export default function Assets() {
  const [balances, setBalances] = createSignal<Array<[string, [string, Balances][]]>>();
  const [transferModalOpen, setTransferModalOpen] = createSignal<{ network: string; asset: string; } | undefined>();

  const saturnContext = useSaturnContext();

    createEffect(() => {
        const id = saturnContext.state.multisigId;
        const address = saturnContext.state.multisigAddress;
        if (typeof id !== 'number' || !address) {
            return;
        }

        const runAsync = async () => {
            const nb = await getBalancesFromAllNetworks(address);

            const remapped = Object.entries(nb).map(([network, assets]) => {
                const ret: [string, [string, Balances][]] = [network,
                    Object.entries(assets)
                        .map(([asset, assetBalances]) => {
                            const ret: [string, Balances] = [asset, assetBalances as Balances];

                            return ret;
                        })
                        .filter(([_, assetBalances]) => assetBalances.freeBalance != '0'
                            || assetBalances.reservedBalance != '0'
                            || assetBalances.frozenBalance != '0')];

                return ret;
            });

            setBalances(remapped);
        };

        runAsync();
    });

  return (
    <>
      <TransferModal
        open={transferModalOpen()}
        setOpen={setTransferModalOpen}
      />

      <div class='flex flex-col gap-4'>
        {balances() ? (

          <For each={balances()}>{([network, assets]) =>
            <Show when={assets.length}>
              <div class='border border-green-500 shadow-sm rounded-lg overflow-hidden w-[60%] mx-auto'>
                <table class='w-full text-sm leading-5'>
                  <thead class='bg-green-500'>
                    <tr>
                      <th>
                        <div class='flex flex-row gap-1 items-center px-2.5 py-2'>
                          <div class='h-7 w-7 rounded-full border border-white'>
                            <img src={Rings[network as keyof typeof Rings].icon} class='h-full w-full p-px rounded-full' />
                          </div>
                          <span class='capitalize text-lg'>
                            {network}
                          </span>
                        </div>
                      </th>
                      <th />
                      <th />
                      <th />
                    </tr>
                    <tr>
                      <th class='py-3 px-4 text-left font-medium text-white w-[20%]'>Asset</th>
                      <th class='py-3 px-4 text-left font-medium text-white w-[20%]'>Transferable</th>
                      <th class='py-3 px-4 text-left font-medium text-white w-[20%]'>Total</th>
                      <th class='w-[40%]' />
                    </tr>
                  </thead>
                  <tbody>
                    <For each={assets}>{([asset, b]) =>
                      <tr>
                        <td class='py-3 px-4 text-left font-medium text-white w-[20%]'>{asset}</td>
                        <td class='py-3 px-4 text-left w-[20%]'>{
                          BigNumber(b.freeBalance)
                            .div(
                              BigNumber('10').pow(
                                BigNumber(Rings[network as keyof typeof Rings].decimals),
                              ),
                            ).decimalPlaces(2, 1).toString()
                        } {asset}</td>
                        <td class='w-[20%]'>{
                          BigNumber(b.freeBalance)
                          .plus(
                            BigNumber(b.reservedBalance).plus(BigNumber(b.frozenBalance))
                          )
                          .div(
                            BigNumber('10').pow(
                              BigNumber(Rings[network as keyof typeof Rings].decimals),
                            ),
                          ).decimalPlaces(2, 1).toString()
                        } {asset}</td>
                        <td class='flex gap-2.5 w-[40%] py-2'>
                          <Button onClick={() => setTransferModalOpen({ network, asset })} class='bg-green-500 hover:bg-saturn-50'>Transfer</Button>

                          <Show when={StakePage[`${ network }_${ asset }` as keyof typeof StakePage]}>
                            <form action={StakePage[`${ network }_${ asset }` as keyof typeof StakePage]} target='_blank'>
                              <Button type='submit' class='bg-green-500 hover:bg-saturn-50'>Stake</Button>
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
  );
}
