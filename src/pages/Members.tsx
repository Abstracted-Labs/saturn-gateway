import { createSignal, For, createEffect, Show } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { useSaturnContext } from "../providers/saturnProvider";
import Identity from '../components/identity/Identity';
import { getAllMembers } from '../utils/getAllMembers';
import { balances } from '@polkadot/types/interfaces/definitions';
import { FALLBACK_TEXT_STYLE } from '../utils/consts';

export type MembersType = { address: string, votes: BigNumber; };

export default function Members() {
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const saturnContext = useSaturnContext();

  createEffect(async () => {
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;

    if (!saturn || typeof multisigId != "number") return;

    const runAsync = async () => {
      const members = await getAllMembers(multisigId, saturn);
      setMembers(members);
    };

    runAsync();
  });

  return (
    <Show when={members()} fallback={<span class={FALLBACK_TEXT_STYLE}>Contacting Uranus...</span>}>
      <div class="relative overflow-x-scroll overscroll-contain h-full flex flex-col content-stretch">
        <table class="w-full text-sm text-left text-black dark:text-white">
          <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
            <tr>
              <th scope="col" class='py-3 px-4 text-left w-[60%]'>Username</th>
              <th scope="col" class='py-3 px-4 text-left w-[30%]'>Votes</th>
              <th scope="col" class='py-3 px-4 text-left w-[10%]'>Delete</th>
            </tr>
          </thead>
          <tbody>
            <For each={members()}>
              {(member, index) =>
                <tr class={index() % 2 === 0 ? 'dark:bg-gray-900 bg-gray-200' : 'dark:bg-gray-800 bg-gray-100'}>
                  <td class='py-3 px-4 h-full font-medium'>
                    <Identity address={member.address} />
                  </td>
                  <td class='py-3 px-4 h-full'>
                    {member.votes.div("1000000").decimalPlaces(2, 1).toString()}
                  </td>
                  <td class='py-3 px-4 h-full'>
                    {/* <div class="flex flex-row gap-2.5">
                      <Button onClick={() => { }} class='bg-green-500 hover:bg-saturn-red'>Give More Votes</Button>
                      <Button onClick={() => { }} class='bg-green-500 hover:bg-saturn-red'>Remove Votes</Button>
                    </div> */}
                  </td>
                </tr>
              }
            </For>
          </tbody>
        </table>
      </div>
    </Show >
  );
}
