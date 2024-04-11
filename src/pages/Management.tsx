import { createSignal, For, createEffect, Show, createMemo, on, onCleanup, Switch, Match } from 'solid-js';
import { BigNumber } from 'bignumber.js';
import { useSaturnContext } from "../providers/saturnProvider";
import Identity from '../components/identity/Identity';
import { getAllMembers } from '../utils/getAllMembers';
import { FALLBACK_TEXT_STYLE, INPUT_COMMON_STYLE, KusamaFeeAssetEnum, MultisigEnum } from '../utils/consts';
import RemoveIcon from '../assets/icons/remove-member-icon.svg';
import SaturnNumberInput from '../components/legos/SaturnNumberInput';
import SearchIcon from '../assets/icons/search.svg';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { useMegaModal } from '../providers/megaModalProvider';
import { BN, hexToString } from '@polkadot/util';
import { FeeAsset, MultisigCallResult } from '@invarch/saturn-sdk';
import { useSelectedAccountContext } from '../providers/selectedAccountProvider';
import { useRingApisContext } from '../providers/ringApisProvider';
import { useToast } from '../providers/toastProvider';
import { getEncodedAddress } from '../utils/getEncodedAddress';
import { withTimeout } from '../utils/withTimeout';

export type MembersType = { address: string, votes: BigNumber; };

export default function Management() {
  let originalMembers: MembersType[];
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [search, setSearch] = createSignal<string>('');
  const [loading, setLoading] = createSignal<boolean>(true);
  const [multisigType, setMultisigType] = createSignal<MultisigEnum>(MultisigEnum.TRADITIONAL);

  const saturnContext = useSaturnContext();
  const selectedAccount = useSelectedAccountContext();
  const ringsApisContext = useRingApisContext();
  const modal = useMegaModal();
  const toast = useToast();

  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const selectedState = createMemo(() => selectedAccount.state);
  const saturnState = createMemo(() => saturnContext.state);

  const removeMember = async (address: string) => {
    const tinkernetApi = ringsApisContext.state.tinkernet;
    const encodedAddress = getEncodedAddress(address, 117);
    const saturn = saturnContext.state.saturn;
    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const feeAsset = selectedState().feeAsset;
    const creationFeeAsset = feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay;

    if (!tinkernetApi || !saturn || !account?.address || !wallet?.signer) {
      toast.setToast('Required components not available for operation', 'error');
      return;
    }

    toast.setToast('Processing member removal...', 'loading');

    const id = saturnContext.state.multisigId;

    try {
      if (id !== undefined && wallet?.signer) {
        const memberBalance = await saturn.getMultisigMemberBalance({
          id,
          address: encodedAddress,
        });

        const proposeCall = saturn.proposeMemberRemoval({
          id,
          address: encodedAddress,
          amount: memberBalance,
        });

        const finalCall = saturn.buildMultisigCall({
          call: proposeCall.call,
          id,
          feeAsset: creationFeeAsset,
          proposalMetadata: JSON.stringify({ message: 'removeMember' }),
        });

        const result = await withTimeout(finalCall.signAndSend(account.address, wallet.signer, feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay), 60000, 'Something went wrong; the request to remove member timed out.');

        if (result) {
          toast.setToast('Member removal proposed successfully', 'success');

          const newMembers = members().filter((member) => member.address !== address);
          setMembers(newMembers);
        } else {
          throw new Error();
        }
      }
    } catch (error) {
      console.error(error);
      toast.setToast('Failed to propose member removal', 'error');
    }
  };

  const addMember = () => {
    modal.showAddMemberModal();
  };

  const proposeNewVotingPower = async (address: string, amount: string) => {
    const tinkernetApi = ringsApisContext.state.tinkernet;
    const encodedAddress = getEncodedAddress(address, 117);
    const saturn = saturnState().saturn;
    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const feeAsset = selectedState().feeAsset;

    if (!tinkernetApi || !saturn || !account?.address || !wallet?.signer) {
      toast.setToast('Required components not available for operation', 'error');
      return;
    }

    toast.setToast('Processing new voting power proposal...', 'loading');

    const id = saturnState().multisigId;

    try {
      if (id !== undefined && wallet?.signer) {
        const bnAmount = new BN(amount).mul(new BN("1000000"));
        const proposeCall = saturn.proposeMemberRemoval({
          id,
          address: encodedAddress,
          amount: bnAmount,
        });

        const finalCall = saturn.buildMultisigCall({
          call: proposeCall.call,
          id,
          feeAsset: feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay,
          proposalMetadata: JSON.stringify({ message: 'proposeNewVotingPower' }),
        });

        const result: MultisigCallResult = await withTimeout(finalCall.signAndSend(account.address, wallet.signer, feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay), 60000, 'Something went wrong; the request to update voting power timed out.');

        if (result) {
          toast.setToast('New voting power proposal submitted successfully. Please wait for the vote to pass.', 'success');

          saturnContext.submitProposal();
        } else {
          throw new Error();
        }
      }
    } catch (error) {
      console.error(error);
      toast.setToast('Failed to propose new voting power', 'error');
    } finally {
      wallet.disconnect();
    }
  };

  const handleSearch = (e: InputEvent) => {
    if (e.target instanceof HTMLInputElement) {
      const value = e.target.value;
      setSearch(value);
      console.log('searching for: ', search());
    }
  };

  createEffect(on(getMultisigId, () => {
    toast.setToast('Loading member list...', 'loading');
    setLoading(true);
    setMembers([]);
  }));

  createEffect(on(getMultisigId, () => {
    let timeout: any;
    const saturn = saturnContext.state.saturn;
    const multisigId = getMultisigId();

    const delayUnload = () => {
      timeout = setTimeout(() => {
        setLoading(false);
        toast.setToast('Member list loaded', 'success');
      }, 200);
    };

    const runAsync = async () => {
      if (!saturn || typeof multisigId !== "number" || isNaN(multisigId)) {
        delayUnload();
        return;
      };

      const members: MembersType[] = await getAllMembers(multisigId, saturn);
      originalMembers = members;
      setMembers(members);

      delayUnload();
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  }));

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

  createEffect(on(() => saturnState().multisigDetails, () => {
    const details = saturnState().multisigDetails;

    const loadMultisigDetails = async () => {
      if (!details) {
        return;
      };

      if (details.metadata && details.requiredApproval) {
        const requiredApproval = new BigNumber(details.requiredApproval.toString());
        const multisigType = requiredApproval.isZero() ? MultisigEnum.TRADITIONAL : MultisigEnum.GOVERNANCE;
        setMultisigType(multisigType);
      }
    };

    loadMultisigDetails();
  }));

  return (
    <>
      <div class="flex flex-row justify-between items-center mb-3">
        <h3 class="text-sm text-saturn-black dark:text-saturn-offwhite">Members {members() && members().length > 0 ? <span class="text-xxs text-saturn-lightgrey align-top ml-1">{members().length}</span> : null}</h3>
        <div class="flex flex-row items-center gap-3">
          <div class="relative flex items-center">
            <input class={`${ INPUT_COMMON_STYLE } pr-8`} id="searchBar" type="text" placeholder="Search by address" value={search()} onInput={handleSearch} />
            <span class="absolute float-right right-0 mr-3">
              <img src={SearchIcon} width={12} height={12} />
            </span>
          </div>
          <button class="py-2 px-4 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75 focus:outline-purple-500" type="button" onClick={addMember}>+ Add Member</button>
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
            <Switch fallback={<div class="mt-4">
              {loading() ? <LoaderAnimation text="Loading member list..." /> : <span class={FALLBACK_TEXT_STYLE}>No members found.</span>}
            </div>}>
              <Match when={members() && members().length > 0}>
                <For each={members()}>
                  {(member, index) => {
                    const [equals, setEquals] = createSignal<boolean>(true);
                    const [votingPower, setVotingPower] = createSignal<string>("0");
                    const hide = createMemo(() => equals());
                    const initialVotingPower = createMemo(() => member.votes.div("1000000").decimalPlaces(2, 1).toString());

                    function isEqual(value: string) {
                      if (value === initialVotingPower()) {
                        setEquals(true);
                      } else {
                        setEquals(false);
                        setVotingPower(value);
                      }
                    }

                    return <tr class='border-b-[1px] border-gray-200 dark:border-gray-800'>
                      <td class='py-3 px-4 h-full font-medium'>
                        <Identity address={member.address} />
                      </td>
                      <td class='py-3 px-4 h-full'>
                        <SaturnNumberInput disabled={loading() || multisigType() === MultisigEnum.TRADITIONAL} label={`UpdateVotes-${ index() }`} min={1} max={50} initialValue={initialVotingPower()} currentValue={(value) => isEqual(value)} />
                      </td>
                      <td class='py-3 px-4'>
                        {hide() ? null : <button class="py-1 px-3 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75 focus:outline-purple-500" type="button" disabled={loading() || multisigType() === MultisigEnum.TRADITIONAL} onClick={() => proposeNewVotingPower(member.address, votingPower())}>Submit Proposal</button>}
                      </td>
                      <td class='py-3 px-4 h-full'>
                        <button type="button" id="removeMember" class="rounded-md hover:opacity-100 opacity-50 focus:outline-saturn-red" onClick={[removeMember, member.address]}><img class="p-2" alt="delete-icon" src={RemoveIcon} /></button>
                      </td>
                    </tr>;
                  }}
                </For>
              </Match>
            </Switch>
          </tbody>
        </table>
      </div>
    </>
  );
}
