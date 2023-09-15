import { createSignal, For, createEffect, Show, createMemo, on } from 'solid-js';
import { BigNumber } from 'bignumber.js';
import { useSaturnContext } from "../providers/saturnProvider";
import Identity from '../components/identity/Identity';
import { getAllMembers } from '../utils/getAllMembers';
import { FALLBACK_TEXT_STYLE, INPUT_COMMON_STYLE } from '../utils/consts';
import RemoveIcon from '../assets/icons/remove-member-icon-14-17x17.svg';
import SaturnNumberInput from '../components/legos/SaturnNumberInput';
import SearchIcon from '../assets/icons/search.svg';

export type MembersType = { address: string, votes: BigNumber; };

export default function Members() {
  let originalMembers: MembersType[];
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [search, setSearch] = createSignal<string>('');
  const saturnContext = useSaturnContext();

  createEffect(async () => {
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;

    if (!saturn || typeof multisigId != "number") return;

    const runAsync = async () => {
      const members = await getAllMembers(multisigId, saturn);
      originalMembers = members;
      setMembers(members);
    };

    runAsync();
  });

  function removeMember(address: string) {
    const newMembers = members().filter((member) => member.address !== address);
    console.log('removing member: ', address);
    setMembers(newMembers);
  }

  function addMember() {
    console.log('adding member...');
    return;
  }

  function proposeNewVotingPower(address: string, votingPower: string) {
    console.log('proposing to update voting power for: ', address, votingPower);
    return;
  }

  function handleSearch(e: InputEvent) {
    if (e.target instanceof HTMLInputElement) {
      const value = e.target.value;
      setSearch(value);
      console.log('searching for: ', search());
    }
  }

  createEffect(on(search, () => {
    // filter members by search
    let filteredMembers = members().filter((member) => {
      return member.address.toLowerCase().includes(search().toLowerCase());
    });

    // handle blank value
    if (search() === '' || filteredMembers.length === 0) {
      filteredMembers = originalMembers;
    }

    setMembers(filteredMembers);
  }));

  return (
    <Show when={members() && members().length} fallback={<span class={FALLBACK_TEXT_STYLE}>Loading member list...</span>}>
      <div class="flex flex-row justify-between items-center mb-3">
        <h3 class="text-sm text-saturn-black dark:text-saturn-offwhite">Members {members() && members().length > 0 ? <span class="text-xxs text-saturn-lightgrey align-top ml-1">{members().length}</span> : null}</h3>
        <div class="flex flex-row items-center gap-3">
          <div class="relative flex items-center">
            <input class={`${ INPUT_COMMON_STYLE } pr-8`} type="text" placeholder="Search by address" value={search()} onInput={handleSearch} />
            <span class="absolute float-right right-0 mr-3">
              <img src={SearchIcon} width={12} height={12} />
            </span>
          </div>
          <button class="py-2 px-4 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75" type="button" onClick={addMember}>+ Add Member</button>
        </div>
      </div>
      <div class="relative overflow-x-scroll overscroll-contain h-full flex flex-col content-stretch">
        <table class="w-full text-sm text-left text-black dark:text-white">
          <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
            <tr>
              <th scope="col" class='py-3 px-4 text-left w-[50%]'>Username</th>
              <th scope="col" class='py-3 px-4 text-center w-[20%]'>Votes</th>
              <th scope="col" class='py-3 px-4 text-center w-[20%]'></th>
              <th scope="col" class='py-3 px-4 text-left w-[10%]'>Delete</th>
            </tr>
          </thead>
          <tbody>
            <For each={members()}>
              {(member, index) => {
                const [equals, setEquals] = createSignal<boolean>(true);
                const [votingPower, setVotingPower] = createSignal<string>("0");
                const hide = createMemo(() => equals());

                function isEqual(value: string) {
                  if (value === member.votes.div("1000000").decimalPlaces(2, 1).toString()) {
                    setEquals(true);
                  } else {
                    setEquals(false);
                    setVotingPower(value);
                  }
                }

                return <tr class={index() % 2 === 0 ? 'dark:bg-gray-700 bg-gray-200' : 'dark:bg-gray-800 bg-gray-100'}>
                  <td class='py-3 px-4 h-full font-medium'>
                    <Identity address={member.address} />
                  </td>
                  <td class='py-3 px-4 h-full'>
                    <SaturnNumberInput initialValue={member.votes.div("1000000").decimalPlaces(2, 1).toString()} currentValue={(value) => isEqual(value)} />
                  </td>
                  <td class='py-3 px-4'>
                    {hide() ? null : <button class="py-1 px-3 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75" type="button" onClick={() => proposeNewVotingPower(member.address, votingPower())}>Submit Proposal</button>}
                  </td>
                  <td class='py-3 px-4 h-full'>
                    <button type="button" class="rounded-md hover:opacity-100 opacity-50 focus:outline-saturn-red" onClick={() => removeMember(member.address)}><img class="p-2" alt="delete-icon" src={RemoveIcon} /></button>
                  </td>
                </tr>;
              }}
            </For>
          </tbody>
        </table>
      </div>
    </Show >
  );
}
