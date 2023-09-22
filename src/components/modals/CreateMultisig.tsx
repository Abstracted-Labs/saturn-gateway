import { For, Match, Switch, createEffect, createMemo, createSignal, on, onMount } from "solid-js";
import SaturnCrumb from "../legos/SaturnCrumb";
import { BN } from "@polkadot/util";
import { FeeAsset } from "@invarch/saturn-sdk";
import { useNavigate } from "@solidjs/router";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { BUTTON_COMMON_STYLE, INPUT_COMMON_STYLE } from "../../utils/consts";
import SaturnCard from "../legos/SaturnCard";

const MULTISIG_CRUMB_TRAIL = ['Choose a Name', 'Add Members', 'Set Voting Threshold', 'Review', 'success'];

const CreateMultisig = () => {
  const [active, setActive] = createSignal(MULTISIG_CRUMB_TRAIL[0]);
  const [multisigName, setMultisigName] = createSignal('');
  const [members, setMembers] = createSignal<[string, number][]>([], { equals: false });
  const [minimumSupportField, setMinimumSupportField] = createSignal<string>('');
  const [requiredApprovalField, setRequiredApprovalField] = createSignal<string>('');
  const navigate = useNavigate();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const ringApisContext = useRingApisContext();
  const disableCrumbs = createMemo(() => {
    const party = members();
    if (multisigName() === '') {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb !== MULTISIG_CRUMB_TRAIL[0]);
    }

    if (party.length === 1) {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2] || crumb === MULTISIG_CRUMB_TRAIL[3]);
    }

    if (party.length > 1) {
      // loop through and check each party member for valid address and weight
      for (const [address, weight] of party) {
        if (address === '' || weight === 0) {
          return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2] || crumb === MULTISIG_CRUMB_TRAIL[3]);
        }
      }
    }

    if (minimumSupportField() === '0' || requiredApprovalField() === '0' || minimumSupportField() === '' || requiredApprovalField() === '') {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[3]);
    }

    return [];
  });

  async function createMultisig() {
    const selected = selectedAccountContext.state;
    const saturn = saturnContext.state.saturn;
    const tinkernetApi = ringApisContext.state.tinkernet;

    console.log(selected);

    if (!saturn || !selected.account || !selected.wallet) return;

    const name = multisigName();
    const requiredApproval = requiredApprovalField();
    const minimumSupport = minimumSupportField();
    const multisigParty = members();

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

    if (multisigParty && typeof multisigParty === 'object') {
      // loop through multisigParty and add vote weight for each member
      for (const [address, weight] of multisigParty) {
        const votes = new BN(weight).mul(new BN("10000000"));
        innerCalls.push(tinkernetApi.tx.inv4.tokenMint(address, votes.toString()));
      }
    }

    const calls = [
      tinkernetApi.tx.balances.transferKeepAlive(multisigAddress, new BN("7000000000000")),
      saturn.buildMultisigCall({
        id: multisigId,
        call: tinkernetApi.tx.utility.batchAll(innerCalls),
      }).call
    ];

    tinkernetApi.tx.utility.batchAll(calls).signAndSend(account.address, { signer: wallet.signer }, ({ status }) => {
      if (status.isFinalized || status.isInBlock) navigate(`/${ multisigId }/members`, { resolve: false });
    });
  };

  function handleSetActive(crumb: string) {
    console.log({ crumb });
    setActive(crumb);
  }

  function getCurrentStep() {
    return active();
  }

  function goBack() {
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const previousStep = MULTISIG_CRUMB_TRAIL[currentIndex - 1];

    setActive(previousStep);
  }

  function getNextStep() {
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const nextStep = MULTISIG_CRUMB_TRAIL[currentIndex + 1];

    return nextStep;
  }

  function goForward() {
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const nextStep = MULTISIG_CRUMB_TRAIL[currentIndex + 1];

    if (disableCrumbs().includes(nextStep)) return;

    setActive(nextStep);
  }

  function addMember() {
    // add another member to members()
    const currentMembers = members();
    const newMembers = [...currentMembers, ['', 1] as [string, number]];
    setMembers(newMembers);
    console.log('added new member: ', newMembers);
  }

  function removeMember(index: number) {
    // remove member from members()
    const currentMembers = members();
    const newMembers = currentMembers.filter((_, i) => i !== index);
    setMembers(newMembers);
    console.log('removed member: ', newMembers);
  }

  createEffect(() => {
    // set self address as first member
    const selected = selectedAccountContext.state;
    const address = selected.account?.address;
    if (address) {
      setMembers([[address, 1]]);
    }
  });

  const STEP_1_NAME = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[0]}>
      'add a name'
      <input type="text" class={INPUT_COMMON_STYLE} value={multisigName()} onInput={(e: any) => setMultisigName(e.target.value)} />
    </div>
  );

  const STEP_2_MEMBERS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[1]}>
      'add members'
      <button type="button" class={BUTTON_COMMON_STYLE} onClick={() => addMember()}>+</button>
      <For each={members()}>
        {([address, weight], index) => (
          <div class="flex flex-row items-center justify-between">
            <input disabled={index() === 0} type="text" class={INPUT_COMMON_STYLE} value={address}
              onBlur={() => console.log('addMember onBlur', members())}
              onInput={(e: any) => {
                const newMembers = members();
                newMembers[index()][0] = e.target.value;
                setMembers(newMembers);
                console.log('new member address: ', index(), e.target.value);
              }} />
            <input type="number" class={INPUT_COMMON_STYLE} value={weight} min={1}
              onBlur={() => console.log('addVote onBlur', members())}
              onInput={(e: any) => {
                const newMembers = members();
                newMembers[index()][1] = e.target.value;
                setMembers(newMembers);
                console.log('new member votes: ', index(), e.target.value);
              }} />
            <button type="button" disabled={index() === 0} class={BUTTON_COMMON_STYLE} onClick={() => removeMember(index())}>-</button>
          </div>
        )}
      </For>
    </div>
  );

  const STEP_3_VOTE_THRESHOLD = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[2]}>
      'add vote threshold'
    </div>
  );

  const STEP_4_CONFIRM = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[3]}>
      'confirm'
    </div>
  );

  const STEP_5_SUCCESS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[4]}>
      'success'
    </div>
  );

  return <div class="w-full flex flex-col">
    <SaturnCrumb trail={MULTISIG_CRUMB_TRAIL} disabledCrumbs={disableCrumbs()} active={active()} setActive={handleSetActive} trailWidth="max-w-full" />
    {/* create forward and back buttons */}
    <div class="flex flex-row justify-between">
      <button disabled={getCurrentStep() === MULTISIG_CRUMB_TRAIL[0]} type="button" class={BUTTON_COMMON_STYLE} onClick={goBack}>Back</button>
      <button disabled={disableCrumbs().includes(getNextStep())} type="button" class={BUTTON_COMMON_STYLE} onClick={goForward}>Next</button>
    </div>
    <SaturnCard>
      <Switch fallback={<span class="text-center text-black dark:text-white">Loading...</span>}>
        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[0]}>
          <STEP_1_NAME />
        </Match>
        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[1]}>
          <STEP_2_MEMBERS />
        </Match>
        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[2]}>
          <STEP_3_VOTE_THRESHOLD />
        </Match>
        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[3]}>
          <STEP_4_CONFIRM />
        </Match>
        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[4]}>
          <STEP_5_SUCCESS />
        </Match>
      </Switch>
    </SaturnCard>
  </div>;
};

CreateMultisig.displayName = "CreateMultisig";
export default CreateMultisig;