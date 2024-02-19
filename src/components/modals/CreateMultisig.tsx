import { For, Match, Show, Switch, createEffect, createMemo, createSignal, lazy, on, onMount } from "solid-js";
import SaturnCrumb from "../legos/SaturnCrumb";
import { BN, stringShorten } from "@polkadot/util";
import { FeeAsset } from "@invarch/saturn-sdk";
import { useNavigate } from "@solidjs/router";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useThemeContext } from "../../providers/themeProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { FALLBACK_TEXT_STYLE, INPUT_CREATE_MULTISIG_STYLE, MultisigEnum } from "../../utils/consts";
import SaturnCard from "../legos/SaturnCard";
import SaturnNumberInput from "../legos/SaturnNumberInput";
import SaturnRadio from "../legos/SaturnRadio";
import GradientBgImage from "../../assets/images/gradient-bg.svg";
import FlagIcon from "../../assets/icons/flag-icon.svg";
import RemoveMemberIcon from "../../assets/icons/remove-member-icon.svg";
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import EditDataIcon from "../../assets/icons/edit-data-icon.svg";
import AyeIcon from "../../assets/icons/aye-icon-17x17.svg";
import NayIcon from "../../assets/icons/nay-icon-17x17.svg";
import CheckIcon from "../../assets/icons/check.svg";
import { isValidPolkadotAddress } from "../../utils/isValidPolkadotAddress";
import { isValidKiltWeb3Name } from "../../utils/isValidKiltWeb3Name";
import LoaderAnimation from "../legos/LoaderAnimation";
import ConnectWallet from "../top-nav/ConnectWallet";
import { MULTISIG_MODAL_ID } from "../left-side/AddMultisigButton";
import { initModals, Modal, ModalInterface } from "flowbite";

const EllipsisAnimation = lazy(() => import('../legos/EllipsisAnimation'));

const THRESHOLD_TEXT_STYLE = "text-xxs p-2 border border-saturn-lightgrey rounded-md text-black dark:text-white";
const SECTION_TEXT_STYLE = "text-black dark:text-white text-lg mb-3";
const LIST_LABEL_STYLE = "text-saturn-darkgrey dark:text-white text-xxs mb-1";
const MULTISIG_CRUMB_TRAIL = ['Choose Name', 'Select Type', 'Add Members', 'Set Thresholds', 'Review', 'success'];

const CreateMultisig = () => {
  let modal: ModalInterface;
  const $modalElement = () => document.getElementById(MULTISIG_MODAL_ID);
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
  const [nameError, setNameError] = createSignal<string>('');
  const [hasAddressError, setHasAddressError] = createSignal<number[]>([]);
  const [finishing, setFinishing] = createSignal<boolean>(false);
  const [disableAddMember, setDisableAddMember] = createSignal<boolean>(false);

  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);
  const selectedState = createMemo(() => selectedAccountContext.state);
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const lessThan1200 = createMemo(() => window.matchMedia('(max-width: 1200px)').matches);
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
    // const isMinimumSupportInvalid = minimumSupportField() === '0' || minimumSupportField() === '' || parseInt(minimumSupportField()) < totalSupportCount();
    const isMinimumSupportInvalid = minimumSupportField() === '0' || minimumSupportField() === '';
    // const isRequiredApprovalInvalid = (multisigType() === MultisigEnum.GOVERNANCE && requiredApprovalField() === '0') || requiredApprovalField() === '' || (multisigType() === MultisigEnum.GOVERNANCE && parseInt(requiredApprovalField()) < totalApprovalCount());
    const isRequiredApprovalInvalid = (multisigType() === MultisigEnum.GOVERNANCE && requiredApprovalField() === '0') || requiredApprovalField() === '';

    if (multisigName() === '' || nameError()) {
      return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb !== MULTISIG_CRUMB_TRAIL[0]);
    }

    // if (totalSupportCount() === 1) {
    //   return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2] || crumb === MULTISIG_CRUMB_TRAIL[3]);
    // }

    // if (totalSupportCount() > 1) {
    //   // loop through and check each party member for valid address and weight
    //   for (const [address, weight] of party) {
    //     if (address === '' || weight === 0) {
    //       return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[2]);
    //     }
    //   }
    // }

    // if (hasAddressError().length > 0) {
    //   return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[3] || crumb === MULTISIG_CRUMB_TRAIL[4]);
    // }

    // if (isMinimumSupportInvalid || isRequiredApprovalInvalid) {
    //   return MULTISIG_CRUMB_TRAIL.filter(crumb => crumb === MULTISIG_CRUMB_TRAIL[4]);
    // }

    if (finishing()) {
      // disable everything
      return MULTISIG_CRUMB_TRAIL;
    }

    return [];
  });
  const inReviewStep = createMemo(() => {
    // check if on next to last crumb trail
    return getCurrentStep() === MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 2];
  });

  async function createMultisig() {
    // create multisig
    setFinishing(true);

    const wallet = selectedState().wallet;
    const account = selectedState().account;
    const saturn = saturnContext.state.saturn;
    const tinkernetApi = ringApisContext.state.tinkernet;

    if (!saturn || !wallet || !account) return;

    wallet.connect();

    const name = multisigName();
    const requiredApproval = requiredApprovalField();
    const minimumSupport = minimumSupportField();
    const multisigParty = members();

    console.log(name, multisigParty, minimumSupport, requiredApproval, wallet.signer);

    if (!name || !wallet.signer) return;

    let ms = parseFloat(minimumSupport);
    let ra = parseFloat(requiredApproval);

    if (!ms) return;

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
        const votes = weight * 1000000;
        innerCalls.push(tinkernetApi.tx.inv4.tokenMint(votes, address));
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
        setActive(MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 1]); // 'success'

        if (status.isFinalized || status.isInBlock) {
          navigate(`/${ multisigId }/assets`, { resolve: false, replace: true });

          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      wallet.disconnect();
    }
  };

  function handleSetActive(crumb: string) {
    // scroll to crumb
    setActive(crumb);
  }

  function handleSetMultisigName(e: any) {
    // set multisig name
    try {
      // first clear any previous errors
      setNameError('');
      // throw an error if it's too long
      if (e.target.value.length > 20) {
        throw new Error('Multisig name cannot be longer than 20 characters.');
      }
      // throw an error if it's empty
      if (e.target.value === '') {
        throw new Error('Multisig name cannot be empty.');
      }
      // throw an error if it's not alphanumeric
      if (!e.target.value.match(/^[a-z0-9]+$/i)) {
        throw new Error('Multisig name must be alphanumeric (letters and numbers).');
      }
      setMultisigName(e.target.value);
    } catch (error) {
      console.error(error);
      setNameError((error as any).message);
    }
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

  function isLastStep() {
    // check if on last step in crumb trail
    return getCurrentStep() === MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 1];
  }

  function goBack() {
    // go back one step
    const currentStep = getCurrentStep();
    const currentIndex = MULTISIG_CRUMB_TRAIL.indexOf(currentStep);
    const previousStep = MULTISIG_CRUMB_TRAIL[currentIndex - 1];

    if (currentIndex === 0) {
      removeModal();
      return;
    }

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

    // remove this index from hasAddressError array
    const newHasAddressError = hasAddressError().filter((i) => i !== index);
    setHasAddressError(newHasAddressError);
    setDisableAddMember(false);
  }

  function abortUi() {
    // reset all state
    setMultisigName('');
    setMembers([]);
    setMinimumSupportField('50');
    setRequiredApprovalField('50');
    setActive(MULTISIG_CRUMB_TRAIL[0]);
    setSelfAddress();
    setFinishing(false);
  }

  function setSelfAddress() {
    const selected = selectedAccountContext.state;
    const address = selected.account?.address;
    if (address) {
      setMembers([[address, 1]]);
    }
  }

  function removeModal() {
    if (modal) {
      modal.hide();
      abortUi();
    }
  }

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });


  onMount(() => {
    abortUi();
  });

  createEffect(() => {
    // set self address as first member
    setSelfAddress();
  });

  createEffect(() => {
    // set default threshold values when multisigType changes 
    if (getCurrentStep() === MULTISIG_CRUMB_TRAIL[2]) {
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
    switch (getCurrentStep()) {
      case MULTISIG_CRUMB_TRAIL[0]:
        setTextHint('This can be the name of your organization, community, department, or anything you like.');
        break;
      case MULTISIG_CRUMB_TRAIL[1]:
        setTextHint('Choose between a traditional multisig or a governance/DAO-style multisig.');
        break;
      case MULTISIG_CRUMB_TRAIL[2]:
        setTextHint('You can add as many members as you need and customize their voting weight (can add more later).');
        break;
      case MULTISIG_CRUMB_TRAIL[3]:
        setTextHint('Vote thresholds are the minimum number of votes required to pass a proposal.');
        break;
      case MULTISIG_CRUMB_TRAIL[4]:
        setTextHint('Review your multisig details and confirm.');
        break;
      case MULTISIG_CRUMB_TRAIL[5]:
        setFinishing(false);
        setTextHint('Congratulations! Now get to work.');
        break;
      default:
        setTextHint('');
        break;
    }
  });

  createEffect(on(members, () => {
    // When navigating away from the members step, clear members with blank addresses
    if (getCurrentStep() !== MULTISIG_CRUMB_TRAIL[2] && members().length > 1) {
      const filteredMembers = members().filter(([address, _], index) => {
        // return !hasAddressError().includes(index) && address !== '';
        return address !== '';
      });
      setMembers(filteredMembers);

      // Reset the error state as well
      setHasAddressError([]);
      setDisableAddMember(false);
      console.log('members: ', members());
    }
  }));

  createEffect(on(inReviewStep, () => {
    // when it's the second to last crumb, log each member and their weight to the console
    if (inReviewStep()) {
      console.log('member vote weights: ', members());
    }
  }));

  const ToCrumb = (props: { crumb: string; }) => {
    // scroll to crumb
    return <button disabled={finishing()} onClick={[handleSetActive, props.crumb]} type="button" class="focus:outline-none ml-1 opacity-50 hover:opacity-100 p-1 rounded-md border border-px border-saturn-lightgrey"><img src={EditDataIcon} /></button>;
  };

  const STEP_LOGIN = () => (
    <div class="text-black dark:text-white" id="STEP_LOGIN">
      <div class={SECTION_TEXT_STYLE}>Connect your Substrate-based wallet to continue.</div>
      <ConnectWallet inMultisig={true} />
    </div>
  );

  const STEP_1_NAME = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[0]}>
      <div class={SECTION_TEXT_STYLE}>First, let's start with a name!</div>
      <input tabIndex={1} type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE } w-5/6`} value={multisigName()} onInput={handleSetMultisigName} />
      <Show when={nameError()}>
        <div class="text-xxs text-saturn-red mt-2">{nameError()}</div>
      </Show>
    </div>
  );

  const STEP_2_SELECT_TYPE = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[1]}>
      <div class={SECTION_TEXT_STYLE}>Second, select a multisig type.</div>
      <p class="text-xs/none">Traditional multisigs are used for simple, straightforward voting where 1 voter = 1 vote.</p>
      <p class="text-xs/none mt-3">Governance multisigs are used for more complex voting scenarios (i.e., DAOs).</p>
      <div class="my-5">
        <SaturnRadio direction="row" selected={multisigType()} options={[MultisigEnum.TRADITIONAL, MultisigEnum.GOVERNANCE]} setSelected={(type: MultisigEnum) => handleSetMultisigType(type)} />
      </div>
    </div>
  );

  const STEP_3_MEMBERS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[2]}>
      <div class={SECTION_TEXT_STYLE}>Next, add some members.</div>

      {/* First row is the multisig creator's address */}
      <div class="flex flex-row items-end gap-2 mb-2">
        <div class={`relative flex flex-col ml-2 md:w-[440px] ${ multisigType() === MultisigEnum.GOVERNANCE ? 'w-2/5' : 'w-5/6' }`}>
          <span class="absolute left-[-7px] top-[33px]"><img src={AyeIcon} width={12} height={12} /></span>
          <label for="defaultMember" class={LIST_LABEL_STYLE}>Address</label>
          <input id="defaultMember" name="defaultMember" disabled type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE }`} value={members()[0] ? members()[0][0] : ''} />
        </div>
        <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
          <div>
            <label for="defaultVotes" class={`${ LIST_LABEL_STYLE } ml-5`}>Votes</label>
            <SaturnNumberInput isMultisigUi label="defaultVotes" id="defaultVotes" min={1} max={50} initialValue={members()[0][1].toString()} currentValue={(votes: string) => {
              const newMembers = members();
              newMembers[0][1] = parseInt(votes);
              setMembers(newMembers);
            }} />
          </div>
        </Show>
        <button type="button" class="px-4 py-[12px] bg-saturn-purple rounded-md hover:bg-purple-600 focus:outline-purple-500 text-md" disabled={disableAddMember()} onClick={addMember}><img alt="Add another member" src={AddMultisigIcon} class="h-4 w-4" /></button>
      </div>

      {/* Scrollable list of additional members */}
      <Show when={members().length > 1}>
        <div id="additionalMembers" class={`saturn-scrollbar h-[130px] pr-1 overflow-y-auto pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
          <For each={members()}>
            {([address, weight], index) => {
              const [error, setError] = createSignal<boolean | undefined>();

              function validateMemberAddress(e: any) {
                e.preventDefault();

                if (hasAddressError().includes(index())) {
                  const newHasAddressError = hasAddressError().filter((i) => i !== index());
                  setHasAddressError(newHasAddressError);
                }

                setError(undefined);

                try {
                  const newMembers = members();
                  const inputValue = e.target.value;
                  const isUnique = () => newMembers.every((member) => member[0] !== inputValue);
                  const isValidAddress = isValidPolkadotAddress(inputValue);

                  if (isUnique() && isValidAddress) {
                    setError(false);
                    newMembers[index()][0] = inputValue;
                    setMembers(newMembers);
                    updateAddressError(index(), true);
                  } else {
                    setError(true);
                    if (!hasAddressError().includes(index())) {
                      setHasAddressError([...hasAddressError(), index()]);
                      console.error('Member address is invalid or was already added.');
                    }
                  }
                } catch (error) {
                  setError(true);
                  console.error(error);
                }
              }

              async function validateWeb3Name(e: any) {
                e.preventDefault();

                try {
                  const newMembers = members();
                  const inputValue = e.target.value;
                  const web3name = await isValidKiltWeb3Name(inputValue);
                  const isUnique = () => newMembers.every((member) => member[0] !== web3name);
                  const isValidAddress = isValidPolkadotAddress(inputValue);

                  // If the input is a valid address and there's no error, we're done
                  if (isValidAddress && error()) {
                    setError(false);
                    newMembers[index()][0] = web3name;
                    setMembers(newMembers);
                    updateAddressError(index(), true);
                    setDisableAddMember(false);
                    return;
                  }

                  // If the web3name is empty, not unique or invalid, set an error
                  if (!web3name || !isUnique()) {
                    setError(true);
                    updateAddressError(index());
                    return;
                  }

                  // At this point, the web3name is valid and unique. Update the member's address.
                  // setError(false);
                  // newMembers[index()][0] = web3name;
                  // setMembers(newMembers);
                  // updateAddressError(index(), true);
                  // setDisableAddMember(false);
                } catch (error) {
                  console.error(error);
                }
              }

              // Helper function to update the address error state
              function updateAddressError(index: number, remove = false) {
                const newHasAddressError = hasAddressError().filter((i) => i !== index);
                if (remove) {
                  setHasAddressError(newHasAddressError);
                } else {
                  setHasAddressError([...hasAddressError(), index]);
                }
              }

              onMount(() => {
                setError(false);

                if (hasAddressError().includes(index())) {
                  const newHasAddressError = hasAddressError().filter((i) => i !== index());
                  setHasAddressError(newHasAddressError);
                }
              });

              createEffect(() => {
                if (error() === true) setDisableAddMember(true);
              });

              return (
                <Show when={address !== selectedState().account?.address}>
                  <div class={`flex flex-row items-center gap-2 mb-2 w-full ${ multisigType() === MultisigEnum.GOVERNANCE ? 'max-w-[515px]' : 'max-w-[489px]' }`}>
                    <div class="relative ml-2 flex-grow">
                      <Switch>
                        <Match when={error() === true}>
                          <span class="absolute left-[-7px] top-[15px]"><img src={NayIcon} width={12} height={12} /></span>
                        </Match>
                        <Match when={error() === false}>
                          <span class="absolute left-[-7px] top-[15px]"><img src={AyeIcon} width={12} height={12} /></span>
                        </Match>
                      </Switch>
                      <input id={`text-${ index() }`} type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE } w-full`} value={address}
                        onInput={validateMemberAddress}
                      // onBlur={validateWeb3Name} TODO: Not working as expected
                      />
                    </div>
                    <div class="relative flex flex-row items-center gap-2">
                      <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
                        <SaturnNumberInput isMultisigUi label={`votes-${ index() }`} min={1} max={50} initialValue={weight.toString()} currentValue={(votes: string) => {
                          const newMembers = members();
                          newMembers[index()][1] = parseInt(votes);
                          setMembers(newMembers);
                        }} />
                      </Show>
                      <div class={`px-2 relative top-[3px] ${ multisigType() === MultisigEnum.GOVERNANCE ? 'left-[-13px] sm:left-0' : '' }`}>
                        <button type="button" disabled={index() === 0} onClick={() => removeMember(index())} class="focus:outline-none opacity-75 hover:opacity-100 h-[15px] w-[17px]"><img src={RemoveMemberIcon} alt="RemoveMember" class="h-[15px] w-[17px]" /></button>
                      </div>
                    </div>
                  </div>
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );

  const STEP_4_VOTE_THRESHOLD = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[3]}>
      <div class={SECTION_TEXT_STYLE}>Now, set the voting thresholds.</div>
      <p class="text-xs/none">Minimum support is the minimum number of votes required to pass a proposal.</p>
      {multisigType() === MultisigEnum.GOVERNANCE && <p class="text-xs/none mt-3">Required approval is the minimum number of votes required to approve a proposal.</p>}
      <div class="flex flex-row items-center justify-start gap-2 sm:gap-5 my-4">
        <div class="flex flex-row items-center gap-1">
          <label for="minimumSupport" class={`${ FALLBACK_TEXT_STYLE } text-left text-[10px]/none`}>Minimum Support (%)</label>
          <SaturnNumberInput isMultisigUi label="minimumSupport" initialValue={minimumSupportField()} currentValue={(support) => setMinimumSupportField(support)} min={1} max={100} />
        </div>
        <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
          <div class="flex flex-row items-center gap-1">
            <label for="requiredApproval" class={`${ FALLBACK_TEXT_STYLE } text-left text-[10px]/none`}>Required Approval (%)</label>
            <SaturnNumberInput isMultisigUi label="requiredApproval" disabled={multisigType() === MultisigEnum.TRADITIONAL} initialValue={requiredApprovalField()} currentValue={(approval) => setRequiredApprovalField(approval)} min={1} max={100} />
          </div>
        </Show>
      </div>
    </div>
  );

  const STEP_5_CONFIRM = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[4]}>
      <div class={SECTION_TEXT_STYLE}>Finally, do one last spot-check.</div>
      <dl class="mt-2 text-xs final-checklist max-h-[200px] overflow-y-scroll saturn-scrollbar pr-3">
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Name <ToCrumb crumb="Choose a Name" /></dt>
          <dd class="text-black dark:text-white">{multisigName()}</dd>
        </div>
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Multisig Type <ToCrumb crumb="Select Type" /></dt>
          <dd class="text-black dark:text-white">{multisigType()}</dd>
        </div>
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Members <ToCrumb crumb="Add Members" /></dt>
          <dd class="text-black dark:text-white border border-saturn-lightgrey rounded-md p-3 w-4/6">
            <div class={`pr-3 pb-3 h-[120px] saturn-scrollbar overflow-y-auto ${ isLightTheme() ? 'islight' : 'isdark' }`}>
              <For each={members()}>
                {([address, weight], index) => (
                  <div class="flex flex-row items-center mb-2 pr-3 text-black dark:text-white">
                    <span class="pr-1">({weight})</span>
                    <span class="pr-3">{address}</span>
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

  const STEP_6_SUCCESS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[5]}>
      <div class={SECTION_TEXT_STYLE}>The multisig has been created and is almost ready. You will be automatically redirected to the Assets page<EllipsisAnimation /></div>
    </div>
  );

  return (
    <>
      <div id={MULTISIG_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden mx-auto md:p-4 md:mb-10 z-[60] w-auto">
        <div id="multisigModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1 w-full" />
        <div class="absolute top-[10px] right-2.5 mb-8 z-[90]">
          <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={removeModal}>
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <div class="flex flex-col px-5 lg:px-2 xs:pt-1 lg:pt-0 z-[60] mt-8 w-full max-w-[1200px]">
          <Show when={!!getCurrentStep()}>
            <Show when={!isLastStep()}>
              <SaturnCrumb trail={MULTISIG_CRUMB_TRAIL} disabledCrumbs={disableCrumbs()} active={getCurrentStep()} setActive={handleSetActive} trailWidth="max-w-full" />
            </Show>
            <SaturnCard noPadding>
              <div class={`p-5 ${ lessThan1200() ? 'h-auto' : 'h-96' }`}>
                <div class={`${ lessThan1200() ? 'flex flex-col' : 'grid grid-cols-4 gap-2 place-items-start lg:place-items-center' } h-full`}>
                  <div class={`${ lessThan1200() ? '' : 'lg:col-span-2 col-span-1 lg:h-44' } px-3`}>
                    <h3 class={`text-2xl/none sm:text-3xl/12 md:text-[5vw] lg:text-[3vw]/none h-auto min-h-[60px] sm:min-h-[90px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] ${ lessThan1200() ? 'mb-3' : 'mb-10' }`}>{!isLastStep() ? <span>
                      Create a new{lessThan1200() ? ' ' : <br />}Saturn Multisig
                    </span> : <span class="flex flex-col items-center"><img src={CheckIcon} width={80} height={80} /><span class="mt-5 break-words">You're All Set!</span></span>}</h3>
                    <Show when={!isLastStep()}>
                      <h6 class="text-xs md:text-sm text-black dark:text-white italic">A Multisig is an account that is managed by one or more owners <br /> using multiple accounts.</h6>
                    </Show>
                  </div>
                  <div class={`${ lessThan1200() ? 'flex flex-col' : 'lg:col-span-2 col-span-3 mx-8' } bg-image`} style={{ 'background-image': `url(${ GradientBgImage })`, 'background-position': 'left' }}>
                    <div class={`flex flex-col justify-center bg-gray-950 bg-opacity-[.03] backdrop-blur rounded-md w-full h-full ${ lessThan1200() ? 'px-3 py-5' : 'p-5' }`}>
                      <Switch fallback={<span class="text-center text-black dark:text-white">Loading...</span>}>
                        <Match when={!isLoggedIn()}>
                          <STEP_LOGIN />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[0]}>
                          <STEP_1_NAME />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[1]}>
                          <STEP_2_SELECT_TYPE />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[2]}>
                          <STEP_3_MEMBERS />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[3]}>
                          <STEP_4_VOTE_THRESHOLD />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[4]}>
                          <STEP_5_CONFIRM />
                        </Match>
                        <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[5]}>
                          <STEP_6_SUCCESS />
                        </Match>
                      </Switch>
                    </div>
                  </div>
                </div>
              </div>
              <Show when={getCurrentStep() !== MULTISIG_CRUMB_TRAIL[5]}>
                <div class={`flex ${ lessThan1200() ? 'flex-col' : 'flex-row' } items-center justify-between bg-gray-200 dark:bg-gray-900 rounded-b-lg`}>
                  <div class={`text-xs dark:text-white text-black text-center mx-auto px-3 ${ lessThan1200() ? 'py-3' : '' }`}>{textHint()}</div>
                  <div class={`flex flex-row ${ lessThan1200() ? 'w-full' : '' }`}>
                    <button disabled={finishing()} type="button" class={`text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none text-center border-r border-r-[1px] dark:border-r-gray-900 border-r-gray-200 ${ !lessThan1200() ? '' : 'rounded-bl-lg' } flex-grow`} onClick={goBack}><span class="px-2 flex">&lt; <span class="ml-2">{getCurrentStep() === MULTISIG_CRUMB_TRAIL[0] ? 'Close' : 'Back'}</span></span></button>
                    <button disabled={disableCrumbs().includes(getNextStep()) || finishing()} type="button" class={`text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-br-lg text-center flex-grow`} onClick={!inReviewStep() ? goForward : createMultisig}>{finishing() ? <span class="px-2 flex justify-end"><LoaderAnimation text="Processing" /></span> : inReviewStep() ? <span class="px-3 flex justify-end">Finish <img src={FlagIcon} alt="Submit" width={13} height={13} class="ml-3" /></span> : <span class="px-2 flex justify-end"><span class="mr-2">Next</span> &gt;</span>}</button>
                  </div>
                </div>
              </Show>
            </SaturnCard>
          </Show>
        </div>
      </div>
    </>
  );
};

CreateMultisig.displayName = "CreateMultisig";
export default CreateMultisig;