import { For, Match, Show, Switch, createEffect, createMemo, createSignal, on, onMount } from "solid-js";
import SaturnCrumb from "../legos/SaturnCrumb";
import { BN, stringShorten } from "@polkadot/util";
import { FeeAsset } from "@invarch/saturn-sdk";
import { useNavigate } from "@solidjs/router";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useThemeContext } from "../../providers/themeProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { BUTTON_COMMON_STYLE, FALLBACK_TEXT_STYLE, INPUT_CREATE_MULTISIG_STYLE, MultisigEnum } from "../../utils/consts";
import SaturnCard from "../legos/SaturnCard";
import SaturnNumberInput from "../legos/SaturnNumberInput";
import SaturnRadio from "../legos/SaturnRadio";
import GradientBgImage from "../../assets/images/gradient-bg.svg";
import FlagIcon from "../../assets/icons/flag-icon.svg";
import RemoveMemberIcon from "../../assets/icons/remove-member-icon.svg";
import EditDataIcon from "../../assets/icons/edit-data-icon.svg";

const THRESHOLD_TEXT_STYLE = "text-xxs p-2 border border-saturn-lightgrey rounded-md text-black dark:text-white";
const SECTION_TEXT_STYLE = "text-black dark:text-white text-lg mb-3";
const LIST_LABEL_STYLE = "text-saturn-darkgrey dark:text-white text-xxs mb-1";
const MULTISIG_CRUMB_TRAIL = ['Choose a Name', 'Add Members', 'Set Voting Thresholds', 'Review', 'success'];

const CreateMultisig = () => {
  const navigate = useNavigate();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const ringApisContext = useRingApisContext();
  const theme = useThemeContext();

  const [active, setActive] = createSignal<string>(MULTISIG_CRUMB_TRAIL[0], { equals: false });
  const [multisigName, setMultisigName] = createSignal('');
  const [members, setMembers] = createSignal<[string, number][]>([], { equals: false });
  const [minimumSupportField, setMinimumSupportField] = createSignal<string>('50');
  const [requiredApprovalField, setRequiredApprovalField] = createSignal<string>('50');
  const [multisigType, setMultisigType] = createSignal<MultisigEnum>(MultisigEnum.TRADITIONAL);
  const [textHint, setTextHint] = createSignal<string>('');

  const selectedState = createMemo(() => selectedAccountContext.state);
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const totalSupportCount = createMemo(() => {
    // number of total members in multisig
    const party = members();
    return party.length;
  });
  const totalApprovalCount = createMemo(() => {
    // number of votes required to approve a proposal
    const party = members();
    let total = 0;

    for (const [_, weight] of party) {
      total += parseInt(weight.toString());
    }
    return total;
  });
  const disableCrumbs = createMemo(() => {
    // check if any fields are invalid and disable crumbs accordingly
    const party = members();
    const isMinimumSupportInvalid = minimumSupportField() === '0' || minimumSupportField() === '' || parseInt(minimumSupportField()) < totalSupportCount();
    const isRequiredApprovalInvalid = (multisigType() === MultisigEnum.GOVERNANCE && requiredApprovalField() === '0') || requiredApprovalField() === '' || (multisigType() === MultisigEnum.GOVERNANCE && parseInt(requiredApprovalField()) < totalApprovalCount());

    if (multisigName() === '') {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb !== MULTISIG_CRUMB_TRAIL[0]);
    }

    // if (totalSupportCount() === 1) {
    //   return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2] || crumb === MULTISIG_CRUMB_TRAIL[3]);
    // }

    if (totalSupportCount() > 1) {
      // loop through and check each party member for valid address and weight
      for (const [address, weight] of party) {
        if (address === '' || weight === 0) {
          return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2] || crumb === MULTISIG_CRUMB_TRAIL[3]);
        }
      }
    }

    if (isMinimumSupportInvalid || isRequiredApprovalInvalid) {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[3]);
    }

    return [];
  });
  const inReviewStep = createMemo(() => {
    // check if on next to last crumb trail
    return getCurrentStep() === MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 2];
  });

  async function createMultisig() {
    const selected = selectedState();
    const saturn = saturnContext.state.saturn;
    const tinkernetApi = ringApisContext.state.tinkernet;

    console.log({ selected });

    if (!saturn || !selected.account || !selected.wallet) return;

    const name = multisigName();
    const requiredApproval = requiredApprovalField();
    const minimumSupport = minimumSupportField();
    const multisigParty = members();

    const { account, wallet } = selected;

    console.log(name, minimumSupport, requiredApproval, wallet.signer);

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

    try {
      tinkernetApi.tx.utility.batchAll(calls).signAndSend(account.address, { signer: wallet.signer }, ({ status }) => {
        if (status.isFinalized || status.isInBlock) navigate(`/${ multisigId }/members`, { resolve: false });
      });
    } catch (error) {
      console.error(error);
    }
  };

  function handleSetActive(crumb: string) {
    // scroll to crumb
    setActive(crumb);
  }

  function handleSetMultisigType(type: MultisigEnum) {
    // set multisig type and associated fields
    if (type === MultisigEnum.TRADITIONAL) {
      setRequiredApprovalField('0');
    } else {
      setRequiredApprovalField('50');
    }
    setMultisigType(type);
  }

  function getCurrentStep() {
    // get current step in crumb trail
    return active();
  }

  function getNextStep() {
    // get next step in crumb trail
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const nextStep = MULTISIG_CRUMB_TRAIL[currentIndex + 1];

    return nextStep;
  }

  function goBack() {
    // go back one step
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const previousStep = MULTISIG_CRUMB_TRAIL[currentIndex - 1];

    setActive(previousStep);
  }

  function goForward() {
    // check if next step is disabled, then go forward one step
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

    // Scroll to the bottom of the saturn-scrollbar element
    const scrollContainer = document.getElementById('additionalMembers');
    if (scrollContainer) {
      // Focus on the newly added input element
      const newInputElement = scrollContainer.lastElementChild?.querySelector('input');
      if (newInputElement) {
        newInputElement.focus();
      }

      scrollContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function removeMember(index: number) {
    // remove member from members()
    const currentMembers = members();
    const newMembers = currentMembers.filter((_, i) => i !== index);
    setMembers(newMembers);
    console.log('removed member: ', newMembers);
  }

  function abortUi() {
    // reset all state
    setMultisigName('');
    setMembers([]);
    setMinimumSupportField('50');
    setRequiredApprovalField('50');
    setActive(MULTISIG_CRUMB_TRAIL[0]);
    setSelfAddress();
  }

  function setSelfAddress() {
    const selected = selectedAccountContext.state;
    const address = selected.account?.address;
    if (address) {
      setMembers([[address, 1]]);
    }
  }

  onMount(() => {
    abortUi();
  });

  createEffect(() => {
    // set self address as first member
    setSelfAddress();
  });

  createEffect(() => {
    // set default threshold values when multisigType changes 
    if (active() === MULTISIG_CRUMB_TRAIL[2]) {
      const supportCount = totalSupportCount();
      const approvalCount = totalApprovalCount();

      if (multisigType() === MultisigEnum.TRADITIONAL) {
        setRequiredApprovalField('0');
      }

      // if (multisigType() === MultisigEnum.TRADITIONAL) {
      //   setRequiredApprovalField('0');
      // } else {
      //   setRequiredApprovalField(approvalCount.toString());
      // }

      // if (supportCount > 0) {
      //   setMinimumSupportField(supportCount.toString());
      // }
    }
  });

  createEffect(() => {
    // update textHint() when active() crumb trail changes
    switch (active()) {
      case MULTISIG_CRUMB_TRAIL[0]:
        setTextHint('This can be the name of your organization, community, department, or anything you like.');
        break;
      case MULTISIG_CRUMB_TRAIL[1]:
        setTextHint('You can add as many multisig members as you need and customize their voting weight.');
        break;
      case MULTISIG_CRUMB_TRAIL[2]:
        setTextHint('Choose either a Traditional or Governance/DAO-style multisig.');
        break;
      case MULTISIG_CRUMB_TRAIL[3]:
        setTextHint('Review your multisig details and confirm.');
        break;
      case MULTISIG_CRUMB_TRAIL[4]:
        setTextHint('Congratulations! Now get to work.');
        break;
      default:
        setTextHint('');
        break;
    }
  });

  const ToCrumb = (props: { crumb: string; }) => {
    // scroll to crumb
    return <button onClick={[handleSetActive, props.crumb]} type="button" class="focus:outline-none ml-1 opacity-50 hover:opacity-100 p-1 rounded-md border border-px border-saturn-lightgrey"><img src={EditDataIcon} /></button>;
  };

  const STEP_1_NAME = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[0]}>
      <div class={SECTION_TEXT_STYLE}>First, let's start with a name!</div>
      <input tabIndex={1} type="text" class={INPUT_CREATE_MULTISIG_STYLE} value={multisigName()} onInput={(e: any) => setMultisigName(e.target.value)} />
    </div>
  );

  const STEP_2_MEMBERS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[1]}>
      <div class={SECTION_TEXT_STYLE}>Next, add some members.</div>

      {/* First row is the multisig creator's address */}
      <div class="flex flex-row items-end gap-2 mb-2">
        <div class="flex flex-col ml-1">
          <label for="defaultMember" class={LIST_LABEL_STYLE}>Address</label>
          <input name="defaultMember" disabled type="text" class={INPUT_CREATE_MULTISIG_STYLE} value={members()[0][0]}
            onInput={(e: any) => {
              const newMembers = members();
              newMembers[0][0] = e.target.value;
              setMembers(newMembers);
            }} />
        </div>
        <div>
          <label for="defaultVotes" class={`${ LIST_LABEL_STYLE } ml-5`}>Votes</label>
          <SaturnNumberInput isMultisigUi label="defaultVotes" min={1} max={50} initialValue={members()[0][1].toString()} currentValue={(votes: string) => {
            const newMembers = members();
            newMembers[0][1] = parseInt(votes);
            setMembers(newMembers);
          }} />
        </div>
        <button type="button" class="py-2 px-4 bg-saturn-purple rounded-md hover:bg-purple-600 focus:outline-purple-500 text-md" onClick={addMember}>+</button>
      </div>

      {/* Scrollable list of additional members */}
      <div id="additionalMembers" class={`saturn-scrollbar h-[130px] pr-1 pt-1 overflow-y-scroll pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
        <For each={members()}>
          {([address, weight], index) => (
            <Show when={address !== selectedState().account?.address}>
              <div class="flex flex-row items-center gap-2 mb-2">
                <div class="ml-1">
                  <input type="text" class={INPUT_CREATE_MULTISIG_STYLE} value={address}
                    onInput={(e: any) => {
                      const newMembers = members();
                      newMembers[index()][0] = e.target.value;
                      setMembers(newMembers);
                      console.log('new member address: ', index(), e.target.value);
                    }} />
                </div>
                <SaturnNumberInput isMultisigUi label="votes" min={1} max={50} initialValue={weight.toString()} currentValue={(votes: string) => {
                  const newMembers = members();
                  newMembers[index()][1] = parseInt(votes);
                  setMembers(newMembers);
                  console.log('new member votes: ', index(), votes);
                }} />
                <button type="button" disabled={index() === 0} onClick={() => removeMember(index())} class="mx-auto focus:outline-none opacity-75 hover:opacity-100"><img src={RemoveMemberIcon} alt="RemoveMember" /></button>
              </div>
            </Show>
          )}
        </For>
      </div>
    </div>
  );

  const STEP_3_VOTE_THRESHOLD = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[2]}>
      <div class={SECTION_TEXT_STYLE}>Now, set the voting thresholds.</div>
      <span class="text-xs">Choose a multisig type</span>
      <SaturnRadio direction="row" selected={multisigType()} options={[MultisigEnum.TRADITIONAL, MultisigEnum.GOVERNANCE]} setSelected={(type: MultisigEnum) => handleSetMultisigType(type)} />
      <div class="mt-2 mb-3">
        <Switch>
          <Match when={multisigType() === MultisigEnum.TRADITIONAL}>
            <div class={THRESHOLD_TEXT_STYLE}>
              Minimum Support should be filled in.
            </div>
          </Match>
          <Match when={multisigType() === MultisigEnum.GOVERNANCE}>
            <div class={THRESHOLD_TEXT_STYLE}>
              Minimum Support and Required Approval should be filled in.
            </div>
          </Match>
        </Switch>
      </div>
      <div class="flex flex-row items-center justify-between gap-3">
        <div class="flex flex-row items-center gap-1">
          <label for="minimumSupport" class={`${ FALLBACK_TEXT_STYLE } text-left text-[11.5px]/none`}>Minimum Support (%)</label>
          <SaturnNumberInput isMultisigUi label="minimumSupport" initialValue={minimumSupportField()} currentValue={(support) => setMinimumSupportField(support)} min={1} max={100} />
        </div>
        <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
          <div class="flex flex-row items-center gap-1">
            <label for="requiredApproval" class={`${ FALLBACK_TEXT_STYLE } text-left text-[11.5px]/none`}>Required Approval (%)</label>
            <SaturnNumberInput isMultisigUi label="requiredApproval" disabled={multisigType() === MultisigEnum.TRADITIONAL} initialValue={requiredApprovalField()} currentValue={(approval) => setRequiredApprovalField(approval)} min={1} max={100} />
          </div>
        </Show>
      </div>
    </div>
  );

  const STEP_4_CONFIRM = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[3]}>
      <div class={SECTION_TEXT_STYLE}>Finally, do one last spot-check.</div>
      <dl class="mt-2 text-xs">
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Name <ToCrumb crumb="Choose a Name" /></dt>
          <dd class="text-black dark:text-white">{multisigName()}</dd>
        </div>
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Members <ToCrumb crumb="Add Members" /></dt>
          <dd class="text-black dark:text-white border border-saturn-lightgrey rounded-md p-5">
            <div class={`saturn-scrollbar pr-3 h-[120px] overflow-y-scroll ${ isLightTheme() ? 'islight' : 'isdark' }`}>
              <For each={members()}>
                {([address, weight], index) => (
                  <div class="flex flex-row items-center gap-2 mb-2 text-black dark:text-white">
                    {stringShorten(address, 10)}
                  </div>
                )}
              </For>
            </div>
          </dd>
        </div>
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Thresholds <ToCrumb crumb="Set Voting Thresholds" /></dt>
          <dd>
            <div>
              <span class="text-saturn-lightgrey text-xxs">Minimum Support:
                <span class="text-black dark:text-white ml-2 text-xs float-right">
                  {minimumSupportField()}%
                </span>
              </span>
              <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
                <br />
                <span class="text-saturn-lightgrey text-xxs">Required Approval:
                  <span class="text-black dark:text-white ml-2 text-xs float-right">
                    {requiredApprovalField()}%
                  </span>
                </span>
              </Show>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  );

  const STEP_5_SUCCESS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[4]}>
      <div class={SECTION_TEXT_STYLE}>That's it!</div>
    </div>
  );

  return <div class="w-full flex flex-col px-5 lg:px-2 xs:pt-1 lg:pt-0">
    <Show when={!!active()}>
      <Show when={getCurrentStep() !== MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 1]}>
        <SaturnCrumb trail={MULTISIG_CRUMB_TRAIL} disabledCrumbs={disableCrumbs()} active={active()} setActive={handleSetActive} trailWidth="max-w-full" />
      </Show>
      <SaturnCard noPadding>
        <div class="p-5 h-96">
          <div class="grid grid-cols-4 gap-2 place-items-center h-full">
            <div class="col-span-2 px-3">
              <h3 class="text-4xl md:text-[5vw]/none lg:text-[3vw]/none h-40 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] mb-10">Create a new<br />Saturn Multisig</h3>
              <h6 class="text-sm text-black dark:text-white">A Multisig is an account that is managed by one or more owners using multiple accounts.</h6>
            </div>
            <div class="mx-8 col-span-2 bg-image" style={{ 'background-image': `url(${ GradientBgImage })` }}>
              <div class="flex flex-col justify-center bg-gray-950 p-5 bg-opacity-[.03] backdrop-blur rounded-md w-full h-full">
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
              </div>
            </div>
          </div>
        </div>
        <div>
          <Show when={getCurrentStep() !== MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 1]}>
            <div class="flex flex-row items-center justify-between bg-gray-200 dark:bg-gray-900 rounded-b-lg">
              <div class="text-xs dark:text-white text-black text-center mx-auto px-3">{textHint()}</div>
              <div class="flex flex-row">
                <button disabled={getCurrentStep() === MULTISIG_CRUMB_TRAIL[0]} type="button" class="text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none text-center border-r border-r-[1px] dark:border-r-gray-900 border-r-gray-200" onClick={goBack}><span class="px-2 flex">&lt; <span class="ml-2">Back</span></span></button>
                <button disabled={disableCrumbs().includes(getNextStep())} type="button" class="text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-br-lg text-center" onClick={!inReviewStep() ? goForward : createMultisig}>{inReviewStep() ? <span class="px-3 flex">Finish <img src={FlagIcon} alt="Submit" width={13} height={13} class="ml-3" /></span> : <span class="px-2 flex"><span class="mr-2">Next</span> &gt;</span>}</button>
              </div>
            </div>
          </Show>
        </div>
      </SaturnCard>
    </Show>
  </div>;
};

CreateMultisig.displayName = "CreateMultisig";
export default CreateMultisig;