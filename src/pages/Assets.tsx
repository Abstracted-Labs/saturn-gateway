import { createSignal, For, createEffect, Show } from 'solid-js';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { Rings } from '../data/rings';
import TransferModal from '../components/modals/transfer';
import { useSaturnContext } from "../providers/saturnProvider";
import type { Balances } from "../utils/getBalances";
import { formatAsset } from '../utils/formatAsset';
import { getAssetIcon } from '../utils/getAssetIcon';
import { getNetworkIcon } from '../utils/getNetworkIcon';

export type AssetsPageProps = {
};

const StakePage = {
  tinkernet_TNKR: 'https://tinker.network/staking',
};

export default function Assets() {
  const [balances, setBalances] = createSignal<Array<[string, [string, Balances][]]>>();
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
      <Show when={balances()} fallback={<span class="text-saturn-black dark:text-saturn-offwhite text-center text-sm">Contacting Uranus...</span>}>
        <div class="relative overflow-x-auto">
          <table class="w-full text-sm text-left text-saturn-lightgrey">
            <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
              <tr>
                <th scope="col" class='py-3 px-4 text-left w-[20%]'>Asset</th>
                <th scope="col" class='py-3 px-4 text-left w-[30%]'>Transferable</th>
                <th scope="col" class='py-3 px-4 text-left w-[30%]'>Total</th>
                <th scope="col" class='w-[20%]'>Chains</th>
              </tr>
            </thead>
            <For each={balances()}>{([network, assets]) =>
              <Show when={assets.length}>
                <tbody class="dark:text-saturn-offwhite text-saturn-black">
                  <For each={assets}>{([asset, b]) =>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <td class='py-3 px-4 text-left w-[20%]'>
                        <span class="flex flex-row items-center gap-1">
                          <span class='h-5 w-5 flex rounded-full bg-black'>
                            <img src={getAssetIcon(asset)} class="p-1" alt={asset} />
                          </span>
                          <span>
                            {asset}
                          </span>
                        </span>
                      </td>
                      <td class='py-3 px-4 text-left w-[30%]'>
                        <span class="flex flex-row items-baseline gap-1">
                          <span>
                            {formatAsset(b.freeBalance, Rings[network as keyof typeof Rings].decimals)}
                          </span>
                          <span class="text-[9px]">{asset}</span>
                          <span class="text-saturn-lightgrey text-[8px]">
                            ($ )
                          </span>
                        </span>
                      </td>
                      <td class='py-3 px-4 text-left w-[30%]'>
                        <span class="flex flex-row items-baseline gap-1">
                          <span>
                            {formatAsset((+b.freeBalance + +b.reservedBalance + +b.frozenBalance).toString(), Rings[network as keyof typeof Rings].decimals)}
                          </span>
                          <span class="text-[9px]">{asset}</span>
                          <span class="text-saturn-lightgrey text-[8px]">
                            ($ )
                          </span>
                        </span>
                      </td>
                      <td>
                        <span class="flex flex-row items-center gap-1">
                          <For each={getNetworkIcon(asset)}>
                            {icon =>
                              <span class='h-5 w-5 flex rounded-full bg-black'>
                                <img src={icon} class="p-1" alt="asset-icon" />
                              </span>
                            }
                          </For>
                        </span>
                      </td>
                    </tr>
                  }</For>
                </tbody>
              </Show>
            }</For>
          </table>
        </div>
      </Show>
    </>
  );
}
