import BigNumber from "bignumber.js";
import { createSignal, createEffect, For, Show, createMemo, lazy, onMount, JSXElement, onCleanup } from "solid-js";
import { AssetEnum, NetworksByAsset, Rings } from "../../data/rings";
import { useProposeContext, Proposal, ProposalType } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import RoundedCard from "../legos/RoundedCard";
import { INPUT_COMMON_STYLE, NetworkEnum } from "../../utils/consts";
import OptionItem from "../legos/OptionItem";
import SaturnSelect from "../legos/SaturnSelect";
import { initDropdowns, Dropdown, type DropdownInterface, type DropdownOptions } from "flowbite";
import { getNetworkBlock } from "../../utils/getNetworkBlock";

const AssetsContext = () => {
  let dropdownFrom: DropdownInterface;
  let dropdownTo: DropdownInterface;
  const [amount, setAmount] = createSignal<BigNumber>(new BigNumber(0));
  const [asset, setAsset] = createSignal<AssetEnum>(AssetEnum.TNKR);
  const [possibleNetworks, setPossibleNetworks] = createSignal<NetworkEnum[]>([]);
  const [initialNetwork, setInitialNetwork] = createSignal<NetworkEnum>(NetworkEnum.TINKERNET);
  const [finalNetworkPair, setFinalNetworkPair] = createSignal<{ from: NetworkEnum; to: NetworkEnum; }>({ from: NetworkEnum.TINKERNET, to: NetworkEnum.TINKERNET });
  const [targetAddress, setTargetAddress] = createSignal<string>('');
  const [bridgeToSelf, setBridgeToSelf] = createSignal<boolean>(false);
  const [isFromDropdownActive, setIsFromDropdownActive] = createSignal(false);
  const [isToDropdownActive, setIsToDropdownActive] = createSignal(false);

  const proposeContext = useProposeContext();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();

  // From dropdown
  const FROM_TOGGLE_ID = 'networkToggleFrom';
  const FROM_DROPDOWN_ID = 'networkDropdownFrom';
  const $toggleFrom = () => document.getElementById(FROM_TOGGLE_ID);
  const $dropdownFrom = () => document.getElementById(FROM_DROPDOWN_ID);

  // To dropdown
  const TO_TOGGLE_ID = 'networkToggleTo';
  const TO_DROPDOWN_ID = 'networkDropdownTo';
  const $toggleTo = () => document.getElementById(TO_TOGGLE_ID);
  const $dropdownTo = () => document.getElementById(TO_DROPDOWN_ID);

  // Dropdown options
  const options: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: -6,
    delay: 300,
  };

  const AllNetworks = (): Record<string, JSXElement> => ({
    [NetworkEnum.KUSAMA]: getNetworkBlock(NetworkEnum.KUSAMA),
    [NetworkEnum.POLKADOT]: getNetworkBlock(NetworkEnum.POLKADOT),
    [NetworkEnum.TINKERNET]: getNetworkBlock(NetworkEnum.TINKERNET),
    // [NetworkEnum.BASILISK]: getNetworkBlock(NetworkEnum.BASILISK),
    // [NetworkEnum.PICASSO]: getNetworkBlock(NetworkEnum.PICASSO),
  });

  // get all networks for For but filter out the current active To network
  const forNetworks = createMemo(() => {
    const pair = finalNetworkPair();
    const allNetworks = Object.entries(AllNetworks());
    // const filteredNetworks = allNetworks.filter(([name, element]) => name != pair.to);
    return allNetworks;
  });

  // get all networks for To but filter out the current active For network
  const toNetworks = createMemo(() => {
    const pair = finalNetworkPair();
    const allNetworks = Object.entries(AllNetworks());
    // const filteredNetworks = allNetworks.filter(([name, element]) => name != pair.from);
    return allNetworks;
  });

  async function proposeTransfer() {
    const pair = finalNetworkPair();

    if (
      !saturnContext.state.saturn ||
      typeof saturnContext.state.multisigId !== 'number' ||
      !saturnContext.state.multisigAddress ||
      !ringApisContext.state[pair.from] ||
      !asset || amount().lte(0)
    ) {
      return;
    }

    if (pair.from == NetworkEnum.TINKERNET && pair.to == NetworkEnum.TINKERNET) {
      const amountPlank = amount().times(BigNumber('10').pow(
        Rings.tinkernet.decimals,
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.LocalTransfer, { chain: NetworkEnum.TINKERNET, asset: asset(), amount: amountPlank, to: targetAddress() })
      );

    } else if (pair.from == NetworkEnum.TINKERNET && pair.to != NetworkEnum.TINKERNET) {
      // Handle bridging TNKR or KSM from Tinkernet to other chains.
    } else if (pair.from != NetworkEnum.TINKERNET && pair.from != pair.to) {
      // Handle bridging assets between other chains.

      const amountPlank = amount().times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.XcmBridge, { chain: pair.from, destinationChain: pair.to, asset: asset(), amount: amountPlank, to: bridgeToSelf() ? undefined : targetAddress() })
      );

    } else if (pair.from != NetworkEnum.TINKERNET && pair.from == pair.to) {
      // Handle balance transfer of assets within another chain.

      const amountPlank = amount().times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.XcmTransfer, { chain: pair.from, asset: asset(), amount: amountPlank, to: targetAddress() })
      );
    }
  };

  function openFrom() {
    if (dropdownFrom) {
      if (!isFromDropdownActive()) {
        dropdownFrom.show();
        setIsFromDropdownActive(true);
      } else {
        closeFromDropdown();
      }
    }
  }

  function openTo() {
    if (dropdownTo) {
      if (!isToDropdownActive()) {
        dropdownTo.show();
        setIsToDropdownActive(true);
      } else {
        closeToDropdown();
      }
    }
  }

  function closeFromDropdown() {
    if (dropdownFrom) {
      dropdownFrom.hide();
      setIsFromDropdownActive(false);
    }
  }

  function closeToDropdown() {
    if (dropdownTo) {
      dropdownTo.hide();
      setIsToDropdownActive(false);
    }
  }

  function handleFromOptionClick(from: NetworkEnum) {
    setFinalNetworkPair({ from, to: finalNetworkPair().to });
    proposeContext.setters.setCurrentNetwork(from);
    closeFromDropdown();
  }

  function handleToOptionClick(to: NetworkEnum) {
    setFinalNetworkPair({ from: finalNetworkPair().from, to });
    closeToDropdown();
  }

  function renderSelectedOption(network: NetworkEnum) {
    return getNetworkBlock(network);
  }

  onMount(() => {
    // This effect is for initializing the dropdowns
    initDropdowns();
    dropdownFrom = new Dropdown($dropdownFrom(), $toggleFrom(), options);
    dropdownTo = new Dropdown($dropdownTo(), $toggleTo(), options);
  });

  createEffect(() => {
    // This effect is for updating the dropdowns when the asset or network changes
    const a = asset();
    const n = initialNetwork();

    if (a && n && NetworksByAsset[a]) {
      setPossibleNetworks(NetworksByAsset[a]);
      setInitialNetwork(n);
      if (proposeContext.state.currentNetwork) {
        setFinalNetworkPair({ from: proposeContext.state.currentNetwork, to: n });
      }
    }
  });

  createEffect(() => {
    // This effect is for closing the dropdowns when clicking outside of them
    const handleClickOutside = (event: any) => {
      const toggleToEl = $toggleTo();
      const dropdownToEl = $dropdownTo();
      const toggleFromEl = $toggleFrom();
      const dropdownFromEl = $dropdownFrom();

      if (toggleToEl && dropdownToEl && !toggleToEl.contains(event.target) && !dropdownToEl.contains(event.target)) {
        dropdownTo.hide();
        setIsToDropdownActive(false);
      }

      if (toggleFromEl && dropdownFromEl && !toggleFromEl.contains(event.target) && !dropdownFromEl.contains(event.target)) {
        dropdownFrom.hide();
        setIsFromDropdownActive(false);
      }
    };

    if (isToDropdownActive() || isFromDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  const MyBalance = () => {
    return <dl class="mt-2 text-xs w-full">
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Total Portfolio Value</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">$ 999,999.99</dd>
      </div>
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Transferable</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">$ 0.00</dd>
      </div>
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Non-Transferable</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">$ 999,999.99</dd>
      </div>
      {/* <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">NFTs</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">69</dd>
      </div> */}
    </dl>;
  };

  const SendCrypto = () => {
    return <div class="flex flex-col w-full">
      <div class='flex flex-col gap-1'>
        <div class='flex flex-row items-center gap-1'>
          <span class="text-xs text-saturn-darkgrey dark:text-saturn-offwhite">from</span>
          <SaturnSelect isOpen={isFromDropdownActive()} isMini={true} toggleId={FROM_TOGGLE_ID} dropdownId={FROM_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().from)} onClick={openFrom}>
            <For each={forNetworks()}>
              {([name, element]) => <OptionItem onClick={() => handleFromOptionClick(name as NetworkEnum)}>
                {element}
              </OptionItem>}
            </For>
          </SaturnSelect>
          <span class="text-xs text-saturn-darkgrey dark:text-saturn-offwhite">to</span>
          <SaturnSelect isOpen={isToDropdownActive()} isMini={true} toggleId={TO_TOGGLE_ID} dropdownId={TO_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().to)} onClick={openTo}>
            <For each={toNetworks()}>
              {([name, element]) => <OptionItem onClick={() => handleToOptionClick(name as NetworkEnum)}>
                {element}
              </OptionItem>}
            </For>
          </SaturnSelect>
        </div>
        {/* <Show when={finalNetworkPair().from != finalNetworkPair().to}>
          <Switch defaultChecked={false} onChange={e => setBridgeToSelf(!bridgeToSelf())}>Bridge To Self</Switch>
        </Show> */}
        <label for="recipient-address" class="text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">Recipient</label>
        <input
          type="text"
          id="recipient-address"
          name="recipient-address"
          placeholder="Destination address"
          value={bridgeToSelf() ? saturnContext.state.multisigAddress : targetAddress()}
          class={INPUT_COMMON_STYLE}
          disabled={bridgeToSelf()}
          onInput={e => setTargetAddress(e.currentTarget.value)}
        />
        <label for="send-amount" class="sr-only text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">Amount</label>
        <input
          type="number"
          id="send-amount"
          name="send-amount"
          placeholder='0'
          value={amount().toString()}
          class={INPUT_COMMON_STYLE}
          onInput={e => {
            const a = parseInt(e.currentTarget.value);
            if (typeof a === 'number') {
              setAmount(new BigNumber(a));
            }
          }}
        />
      </div>
      <button type="button" class="mt-4 text-sm rounded-md bg-saturn-purple grow px-6 py-3 text-white focus:outline-none hover:bg-purple-800" onClick={proposeTransfer}>Perform Transaction</button>
    </div>;
  };

  return <div class="mb-5">
    <RoundedCard header="My Balance">
      <MyBalance />
    </RoundedCard>
    <RoundedCard header="Send Crypto">
      <SendCrypto />
    </RoundedCard>
  </div>;
};

AssetsContext.displayName = 'AssetsContext';
export default AssetsContext;