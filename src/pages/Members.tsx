import { createSignal, For, createEffect } from 'solid-js';
import { Button } from '@hope-ui/solid';
import { BigNumber } from 'bignumber.js';
import { useSaturnContext } from "../providers/saturnProvider";
import Identity from '../components/identity/Identity';

export default function Members() {
  const [members, setMembers] = createSignal<{ address: string, votes: BigNumber; }[]>([]);

  const saturnContext = useSaturnContext();

  createEffect(() => {
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;

    console.log(saturn, multisigId);

    if (!saturn || typeof multisigId != "number") return;

    console.log("1");

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
    <div class='border border-green-500 shadow-sm rounded-lg overflow-hidden mx-auto w-fit'>
      <table class='w-full text-sm leading-5'>
        <thead class='bg-green-500'>
          <tr>
            <th class='py-3 px-4 text-left font-medium text-white'>Member</th>
            <th class='py-3 px-4 text-left font-medium text-white'>Votes</th>
            <th class="" />
          </tr>
        </thead>
        <tbody>
          <For each={members()}>
            {(member) =>
              <tr>
                <td class='py-3 px-4 h-full text-left font-medium text-white'>
                  <Identity address={member.address} />
                </td>
                <td class='py-3 px-4 h-full text-left'>
                  {member.votes.div("1000000").decimalPlaces(2, 1).toString()}
                </td>
                <td class='py-3 px-4 h-full'>
                  <div class="flex flex-row gap-2.5">
                    <Button onClick={() => { }} class='bg-green-500 hover:bg-saturn-red'>Give More Votes</Button>
                    <Button onClick={() => { }} class='bg-green-500 hover:bg-saturn-red'>Remove Votes</Button>
                  </div>
                </td>
              </tr>
            }</For>
        </tbody>
      </table>
    </div>
  );
}
