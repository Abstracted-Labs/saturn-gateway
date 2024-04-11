import { createSignal, For, createEffect, Switch, Match, onCleanup, createMemo, onMount, Show, JSX } from 'solid-js';
import { ParsedTallyRecords, type CallDetailsWithHash, type ParsedTallyRecordsVote, FeeAsset } from '@invarch/saturn-sdk';
import { BN, hexToString, stringShorten, u8aToHex, u8aToString } from '@polkadot/util';
import type { AnyJson } from '@polkadot/types/types/codec';
import type { Call, EventRecord } from '@polkadot/types/interfaces';
import { useLocation } from '@solidjs/router';
import { useRingApisContext } from "../providers/ringApisProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { Rings } from '../data/rings';
import FormattedCall from '../components/legos/FormattedCall';
import { getAllMembers } from '../utils/getAllMembers';
import { MembersType } from './Management';
import SaturnAccordionItem from '../components/legos/SaturnAccordionItem';
import { initAccordions, AccordionInterface, Accordion as FlowAccordion, AccordionItem as FlowAccordionItem } from 'flowbite';
import { FALLBACK_TEXT_STYLE, KusamaFeeAssetEnum } from '../utils/consts';
import { processCallData } from '../utils/processCallData';
import AyeIcon from '../assets/icons/aye-icon-17x17.svg';
import NayIcon from '../assets/icons/nay-icon-17x17.svg';
import SaturnProgress from '../components/legos/SaturnProgress';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { SubmittableResult } from '@polkadot/api';
import { getEncodedAddress } from '../utils/getEncodedAddress';
import { useToast } from '../providers/toastProvider';
import { Identity } from '../components';
import { withTimeout } from '../utils/withTimeout';

export const ACCORDION_ID = 'accordion-collapse';

export type QueuePageProps = {
};

export default function Transactions() {
  const [accordion, setAccordion] = createSignal<AccordionInterface | undefined>(undefined);
  const [pendingProposals, setPendingProposals] = createSignal<CallDetailsWithHash[]>([]);
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [activeIndex, setActiveIndex] = createSignal<number>(-1);
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>(KusamaFeeAssetEnum.TNKR);

  const toast = useToast();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();
  const multisigHashId = loc.pathname.split('/')[1];

  const encodedAddress = createMemo(() => getEncodedAddress(selectedAccountContext.state.account?.address || '', 117));
  const saturn = createMemo(() => saturnContext.state.saturn);
  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const getMultisigDetails = createMemo(() => saturnContext.state.multisigDetails);
  const isTraditionalMultisig = createMemo(() => getMultisigDetails()?.requiredApproval.toNumber() === 0);
  const getMembers = createMemo(() => members());

  const hasVoted = (pc: CallDetailsWithHash) => {
    const address = encodedAddress();
    if (!address) {
      console.error('No address found for the selected account');
      return false;
    }
    const voterRecord = pc.details.tally.records[address];
    if (!voterRecord) {
      return false;
    }
    const hasAye = 'aye' in voterRecord && voterRecord.aye !== undefined;
    const hasNay = 'nay' in voterRecord && voterRecord.nay !== undefined;
    return hasAye || hasNay;
  };

  const totalVotes = (records: ParsedTallyRecords, voteType?: 'aye' | 'nay'): number => {
    let total = 0;
    for (let record of Object.values(records)) {
      if (voteType === 'aye' && record.aye) {
        total += parseInt(record.aye.toString());
      } else if (voteType === 'nay' && record.nay) {
        total += parseInt(record.nay.toString());
      } else if (!voteType) {
        if (record.aye) {
          total += parseInt(record.aye.toString());
        }
        if (record.nay) {
          total += parseInt(record.nay.toString());
        }
      }
    }

    return total / 1000000;
  };

  const totalAyeVotesPercent = (records: ParsedTallyRecords): number => {
    let total = 0;

    for (let record of Object.values(records)) {
      const ayeVotes = parseInt(record.aye?.toString() || '0', 10);
      if (!isNaN(ayeVotes)) {
        total += ayeVotes;
      }
    }

    const totalVotesCount = totalVotes(records);
    if (totalVotesCount === 0) {
      return 0;
    }
    const percentage = (total / 1000000) / totalVotesCount * 100;

    const roundedPercentage = Math.round(percentage);

    return isNaN(roundedPercentage) ? 0 : roundedPercentage;
  };

  const totalNayVotesPercent = (records: ParsedTallyRecords): number => {
    let total = 0;

    for (let record of Object.values(records)) {
      const nayVotes = parseInt(record.nay?.toString() || '0', 10);
      if (!isNaN(nayVotes)) {
        total += nayVotes;
      }
    }

    const totalVotesCount = totalVotes(records);
    if (totalVotesCount === 0) {
      return 0;
    }
    const percentage = (total / 1000000) / totalVotesCount * 100;

    const roundedPercentage = Math.round(percentage);

    return isNaN(roundedPercentage) ? 0 : roundedPercentage;
  };

  const handleAccordionClick = (index: number) => {
    const accord = accordion();

    try {
      if (!accord || !accord._items || !accord._items.length) {
        console.error('Accordion or accordion item is not initialized or index is out of bounds');
        return;
      }

      const item = accord._items[index];
      if (!item || !item.triggerEl) {
        console.error(`Accordion item or its triggerEl at index ${ index } is undefined`);
        return;
      }

      if (item.triggerEl) {
        if (index === activeIndex()) {
          setActiveIndex(-1);
          accord.close(`content${ index }`);
        } else {
          accord.open(`content${ index }`);
          setActiveIndex(index);
        }
      }
    } catch (e) {
      return null;
    }
  };

  const withdrawVote = async (pc: CallDetailsWithHash) => {
    const selectedAccountAddress = selectedAccountContext.state.account?.address;
    const sat = saturn();
    const multisigId = saturnContext.state.multisigId;
    const callHash = pc.callHash.toString();

    if (!selectedAccountAddress) {
      toast.setToast('No account selected', 'error');
      return;
    }

    if (!hasVoted(pc)) {
      toast.setToast('You have not submitted a vote yet', 'error');
      return;
    }

    if (!sat || typeof multisigId !== 'number') {
      toast.setToast('Invalid state for withdrawing vote', 'error');
      return;
    }

    toast.setToast('Processing vote withdrawal request...', 'loading');

    try {
      const call = sat.withdrawVote({
        id: multisigId,
        callHash,
      });

      await call.signAndSend(selectedAccountAddress, { signer: selectedAccountContext.state.wallet?.signer }, ({ status }) => {
        console.log(status.isFinalized, status.isInBlock);
        toast.setToast('Vote withdrawn', 'success');
        setLoading(true);
      });

    } catch (error) {
      console.error(error);
      toast.setToast('An error occurred', 'error');
    }
  };

  const vote = async (callHash: string, aye: boolean) => {
    const selected = selectedAccountContext.state;
    const sat = saturn();

    if (!sat || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number') {
      toast.setToast('Could not process your vote', 'error');
      return;
    }

    toast.setToast('Processing your vote...', 'loading');

    try {
      await sat.vote({
        id: saturnContext.state.multisigId,
        callHash,
        aye,
      }).signAndSend(selected.account.address, { signer: selected.wallet.signer }, ({ status }) => {
        if (status.isFinalized || status.isInBlock) {
          toast.setToast('Vote submitted', 'success');
          setLoading(true);
        }
      });

    } catch (error) {
      console.error(error);
      toast.setToast('An error occurred', 'error');
    }
  };

  const killProposal = async (callHash: string) => {
    const sat = saturn();
    const selectedAccountAddress = selectedAccountContext.state.account?.address;
    const signer = selectedAccountContext.state.wallet?.signer;
    const multisigId = getMultisigId();

    if (!sat || !selectedAccountAddress || !signer || typeof multisigId !== 'number') {
      toast.setToast('Could not process your kill bill proposal', 'error');
      return;
    }

    toast.setToast('Processing kill bill request...', 'loading');

    try {
      const cancelCall = sat.api.tx.inv4.cancelMultisigProposal(callHash);

      const multisigCall = sat.buildMultisigCall({
        id: multisigId,
        call: cancelCall,
      });

      const result = await withTimeout(multisigCall.signAndSend(selectedAccountAddress, signer, feeAsset() === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay), 60000, 'Something went wrong and your kill bill request timed out.');

      if (result) {
        toast.setToast('Kill bill successfully submitted', 'success');
      } else {
        toast.setToast('Failed to submit kill bill', 'error');
        throw new Error('Failed to submit kill bill');
      }

      setLoading(true);
    } catch (error) {
      console.error(error);
      toast.setToast('An error occurred', 'error');
    }
  };

  // Decode transaction call hash
  const processCallDescription = (call: Call, metadata?: string): string => {
    const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
    const amount = (call.toHuman().args as Record<string, AnyJson>).amount?.toString();
    const recipient = stringShorten((call.toHuman().args as Record<string, AnyJson>).to?.toString() || '', 10);
    const value = (call.toHuman().args as Record<string, AnyJson>).value?.toString();
    const dest = ((call.toHuman().args as Record<string, AnyJson>).dest as Record<string, AnyJson>);
    const target = stringShorten((call.toHuman().args as Record<string, AnyJson>).target?.toString() || '', 10);
    const callHash = stringShorten(call.hash.toString(), 10);
    let id;

    switch (call.method) {
      case 'sendCall':
        const innerCall = (call.toHuman().args as Record<string, AnyJson>).call?.toString();

        if (!chain || !innerCall || !ringApisContext.state[chain]) {
          return '';
        }

        const xcmCall = ringApisContext.state[chain].createType('Call', innerCall);

        return `Execute ${ xcmCall.section }.${ xcmCall.method } call`;

      case 'cancelMultisigProposal':
        return `Cancel multisig proposal with call hash ${ callHash }`;

      case 'tokenMint':
        return `Add new member or increase voting power to ${ amount?.toString() } for ${ target }`;

      case 'tokenBurn':
        return `Remove member or decrease voting power by ${ amount?.toString() } for ${ target }`;

      case 'transfer':
        if (!dest) return '';
        id = stringShorten(dest.Id?.toString() || '', 10);
        console.log('data: ', (call.toHuman().args as Record<string, AnyJson>));
        return `Transfer tokens in the amount of ${ value?.toString() } to ${ id }`;

      case 'transferKeepAlive':
        if (!dest) return '';
        id = stringShorten(dest.Id?.toString() || '', 10);
        return `Transfer tokens in the amount of ${ value?.toString() } to ${ id }`;

      case 'transferAssets':
        return `Cross-chain asset transfer in the amount of ${ amount?.toString() } to ${ recipient }`;

      case 'bridgeAssets':
        return `Cross-chain asset bridge in the amount of ${ amount?.toString() } to ${ recipient }`;

      case 'operateMultisig':
        const operateMultisigMsg = metadata;
        if (operateMultisigMsg && operateMultisigMsg.includes('removeMember')) {
          return 'Remove member from omnisig';
        }
        if (operateMultisigMsg && operateMultisigMsg.includes('proposeNewVotingPower')) {
          return 'Propose new voting power for a member';
        }

      case 'batchAll':
        const batchAllMsg = metadata;
        if (batchAllMsg && batchAllMsg.includes('proposeNewMembers')) {
          return 'Add new member(s) to omnisig';
        }

      default:
        return `Execute ${ call.section }.${ call.method } call`;
    }
  };

  const processNetworkIcons = (call: Call): string[] => {
    if (call.method === 'sendCall') {
      const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
      if (!chain) {
        return [];
      }

      const ring = JSON.parse(JSON.stringify(Rings))[chain];
      console.log('ring: ', ring);
      return [ring.icon];
    }
    return [Rings.tinkernet?.icon as string];
  };

  // Decode external transaction to human readable format
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
    console.log('objectOrder: ', objectOrder);
    return Object.assign(objectOrder, ringApisContext.state[chain].createType('Call', call).toHuman());
  };

  // Calculate the percentage of support met
  const processSupport = (ayes: BN): number => {
    if (!saturnContext.state.multisigDetails) {
      return 0;
    }

    const totalSupply = saturnContext.state.multisigDetails.totalIssuance;

    return new BN(ayes).mul(new BN('100')).div(totalSupply).toNumber();
  };

  // Calculate the percentage of aye votes
  const processApprovalAye = (ayes: BN, nays: BN): number => new BN(ayes).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

  // Calculate the percentage of nay votes
  const processApprovalNay = (ayes: BN, nays: BN): number => new BN(nays).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

  const isItemActive = (index: number) => {
    const current = activeIndex();
    return index === current;
  };

  createEffect(() => {
    const selectedAsset = selectedAccountContext.setters.getFeeAsset() as KusamaFeeAssetEnum;
    setFeeAsset(selectedAsset);
  });

  createEffect(() => {
    const sat = saturn();
    const multisigId = getMultisigId();

    if (!loading()) return;

    const runAsync = async () => {
      setActiveIndex(-1);

      toast.setToast('Loading proposals...', 'loading');

      if (!sat || typeof multisigId !== 'number') {
        return;
      }

      const members = await getAllMembers(multisigId, sat);
      setMembers(members);

      setTimeout(async () => {
        const pendingCalls = await sat.getPendingCalls(multisigId);

        if (!pendingCalls || !pendingCalls.length) {
          setLoading(false);
          toast.setToast('No proposals to display', 'info');
          return;
        }

        setPendingProposals(pendingCalls);
        toast.setToast('Proposals loaded', 'success');
      }, 2000);
    };

    runAsync();
  });

  createEffect(() => {
    const pc = pendingProposals();

    if (!pc || !pc.length) {
      return;
    }

    try {
      if (document && pc.length > 0) {
        const parentEl = () => document.getElementById(ACCORDION_ID);
        const accordionItems = () => pc.map((p, index) => {
          const triggerEl = document.getElementById(`heading${ index }`) as HTMLElement;
          const targetEl = document.getElementById(`content${ index }`) as HTMLElement;

          if (p && triggerEl && targetEl) {
            return {
              id: `content${ index }`,
              triggerEl,
              targetEl,
              active: false,
            };
          }
        });

        const items = accordionItems().filter(item => item !== undefined) as FlowAccordionItem[];
        const accordion = new FlowAccordion(parentEl(), items);
        setAccordion(accordion);
        // toast.setToast('Proposals loaded', 'success');
      }
    } catch (e) {
      console.error(e);
      toast.setToast('Error loading proposals', 'error');
    } finally {
      setLoading(false);
    }
  });

  const voteThreshold = (): JSX.Element => {
    const minimumSupportStr = saturnContext.state.multisigDetails?.minimumSupport.toHuman();
    const totalMembers = getMembers();

    if (!minimumSupportStr || totalMembers.length === 0) return;

    const minimumSupport = parseFloat(minimumSupportStr) / 100;
    const votesNeeded = Math.ceil(totalMembers.length * minimumSupport);

    return (
      <div class="text-xs text-saturn-lightgrey mb-10">
        <p>
          <span class="mr-1">Voting Threshold:</span><br /><br /><span class="font-bold text-white">{votesNeeded} {votesNeeded > 1 ? "votes" : "vote"}</span> {votesNeeded > 1 ? "are" : "is"} needed from a pool of <span class="font-bold text-white">{totalMembers.length} {totalMembers.length > 1 ? "members" : "member"}</span>
        </p>
      </div>
    );
  };

  return (
    <div>
      <div id={ACCORDION_ID} data-accordion="collapse" class="flex flex-col h-full">
        <Switch fallback={<div>
          {loading() ? <LoaderAnimation text="Please wait..." /> : <span class={FALLBACK_TEXT_STYLE}>No transactions to display.</span>}
        </div>}>
          <Match when={pendingProposals().length > 0}>
            <div class="overflow-y-scroll saturn-scrollbar pr-5 md:h-[550px] mb-3">
              <For each={pendingProposals()}>
                {(pc: CallDetailsWithHash, index) => {
                  const metadata = pc.details.proposalMetadata;
                  console.log('metadata: ', metadata);
                  const proposalMetadata = typeof metadata === 'string' ? metadata : metadata ? u8aToString(metadata) : null;
                  const parsedMetadata = proposalMetadata ? JSON.parse(proposalMetadata).message : null;
                  const preparer = pc.details.originalCaller;
                  return <SaturnAccordionItem heading={processCallDescription(pc.details.actualCall as unknown as Call, parsedMetadata)} icon={processNetworkIcons(pc.details.actualCall as unknown as Call)} headingId={`heading${ index() }`} contentId={`content${ index() }`} onClick={() => handleAccordionClick(index())} active={isItemActive(index())}>
                    {/* Proposal description */}
                    {proposalMetadata && <div class="flex flex-col mt-3">
                      <div class="text-xs text-saturn-lightgrey mb-1">Proposal description:</div>
                      <p class="rounded-md p-3 border-2 border-gray-800 text-sm">{parsedMetadata}</p>
                    </div>}
                    <div class="flex flex-row">
                      {/* Call data */}
                      <div class="max-h-[300px] w-full my-2 grow">
                        <FormattedCall call={processCallData(pc.details.actualCall as unknown as Call, ringApisContext)} />
                      </div>

                      <div>
                        {/* Preparer */}
                        <div class="flex flex-col items-end ml-2 mt-2">
                          <div class="text-xs text-saturn-lightgrey mb-1">Prepared by:</div>
                          <Identity address={preparer} />
                        </div>

                        {/* Votes history */}
                        <div class='relative items-center flex-col shrink border border-px rounded-md border-gray-100 dark:border-gray-800 my-2 ml-2 px-2 w-60 h-32 overflow-y-scroll saturn-scrollbar p-2'>
                          <For each={Object.entries(pc.details.tally.records)}>
                            {([voter, vote]: [string, ParsedTallyRecordsVote]) => {
                              const voteCount = new BN(vote.aye?.toString() || vote.nay?.toString() || '0').div(new BN('1000000')).toString();
                              return <div class="flex flex-row items-center mb-1">
                                <div class='flex lg:h-3 lg:w-3 md:h-3 md:w-3 rounded-full relative mr-1'>
                                  {vote.aye
                                    ? <img src={AyeIcon} />
                                    : <img src={NayIcon} />
                                  }
                                </div>
                                <div class='flex flex-row items-center justify-between gap-2'>
                                  <div
                                    class='text-xs font-bold text-black dark:text-white'
                                  >
                                    {stringShorten(voter, 4)}
                                  </div>
                                  <div class="text-xxs text-saturn-lightgrey leading-none">
                                    {` voted ${ vote.aye ? 'Aye' : 'Nay' } with ${ voteCount } ${ +voteCount > 1 ? 'votes' : 'vote' }`}
                                  </div>
                                </div>
                              </div>;
                            }}
                          </For>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-row justify-between">
                      {/* Vote breakdown */}
                      <div class="flex flex-col items-center justify-around gap-3 rounded-md w-full border border-[1.5px] border-gray-100 dark:border-gray-800 p-4">
                        <SaturnProgress total={totalVotes(pc.details.tally.records, 'aye')} percentage={totalAyeVotesPercent(pc.details.tally.records)} color='bg-saturn-green' label='Voted "Aye"' />
                        <Show when={!isTraditionalMultisig()}>
                          <SaturnProgress total={totalVotes(pc.details.tally.records, 'nay')} percentage={totalNayVotesPercent(pc.details.tally.records)} color='bg-saturn-red' label='Voted "Nay"' />
                        </Show>
                        {/* <SaturnProgress percentage={totalVotes(pc.details.tally.records) / members().length * 100} overridePercentage={<span class="text-xs text-black dark:text-white">
                        <span>{totalVotes(pc.details.tally.records)}</span>
                        <span class="text-saturn-lightgrey"> / {members().length}</span>
                      </span>} color='bg-saturn-purple' label='Voter Turnout' /> */}
                      </div>

                      {/* Support breakdown and Kill button */}
                      <div class="flex flex-col justify-between ml-2 w-60">
                        <Show when={isTraditionalMultisig()}>
                          {voteThreshold()}
                        </Show>
                        <Show when={!isTraditionalMultisig()}>
                          <dl class="flex flex-col text-xs py-2">
                            <div class="flex flex-row justify-between gap-x-5 mb-3 text-saturn-lightgrey w-full">
                              <dt class="w-full">Support needed:</dt>
                              <dd class="text-black dark:text-white">
                                {saturnContext.state.multisigDetails?.minimumSupport.toHuman() || 'Error'}
                              </dd>
                            </div>
                            <div class="flex flex-row justify-between gap-5 mb-3 text-saturn-lightgrey w-full">
                              <dt class="w-full">Approval needed:</dt>
                              <dd class="text-black dark:text-white">
                                {saturnContext.state.multisigDetails?.requiredApproval.toHuman() || 'Error'}
                              </dd>
                            </div>
                          </dl>
                        </Show>
                        <div>
                          <button
                            type="button"
                            class="rounded-md hover:opacity-75 border-2 border-saturn-red p-2 text-xs text-saturn-red justify-center w-full focus:outline-none"
                            onClick={() => killProposal(pc.callHash.toString())}
                            disabled={loading()}
                          >
                            Kill Proposal
                          </button>
                        </div>
                      </div>
                    </div>
                    <Show when={!hasVoted(pc)}>
                      <div class='flex flex-row gap-3 my-3 actions'>
                        <Show when={!isTraditionalMultisig()}>
                          <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-green p-2 text-xs text-black justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), true)}>Vote Aye</button>
                          <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-red p-2 text-xs text-white justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), false)}>Vote Nay</button>
                        </Show>
                        <Show when={isTraditionalMultisig()}>
                          <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-green p-2 text-xs text-black justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), true)}>Approve Proposal</button>
                        </Show>
                      </div>
                    </Show>
                    <Show when={hasVoted(pc)}>
                      <div class='flex flex-row gap-3 my-3 actions'>
                        <button
                          type="button"
                          class="rounded-md hover:opacity-75 bg-saturn-yellow p-2 text-xs text-black justify-center w-full focus:outline-none font-bold"
                          onClick={[withdrawVote, pc]}
                        >
                          Withdraw Vote
                        </button>
                      </div>
                    </Show>
                  </SaturnAccordionItem>;
                }}
              </For>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
