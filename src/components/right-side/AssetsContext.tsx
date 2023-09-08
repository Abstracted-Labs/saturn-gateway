import BigNumber from "bignumber.js";
import { createSignal, createEffect, For, Show, createMemo, lazy, onMount, JSXElement, onCleanup, on } from "solid-js";
import { AssetEnum, NetworksByAsset, Rings } from "../../data/rings";
import { useProposeContext, Proposal, ProposalType } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import RoundedCard from "../legos/RoundedCard";
import { INPUT_COMMON_STYLE, MINI_TEXT_LINK_STYLE, NetworkEnum } from "../../utils/consts";
import OptionItem from "../legos/OptionItem";
import SaturnSelect from "../legos/SaturnSelect";
import { initDropdowns, Dropdown, type DropdownInterface, type DropdownOptions } from "flowbite";
import { getNetworkBlock } from "../../utils/getNetworkBlock";
import { getAssetBlock } from "../../utils/getAssetBlock";
import { getAssetsFromNetwork } from "../../utils/getAssetsFromNetwork";
import { Balances, getBalancesFromAllNetworks } from "../../utils/getBalances";
import { formatAsset } from "../../utils/formatAsset";
import { getCurrentUsdPrice } from "../../utils/getCurrentUsdPrice";

const AssetsContext = () => {
  let dropdownFrom: DropdownInterface;
  let dropdownTo: DropdownInterface;
  let dropdownAsset: DropdownInterface;
  const [amount, setAmount] = createSignal<number>(0);
  const [asset, setAsset] = createSignal<AssetEnum>(AssetEnum.TNKR);
  const [initialNetwork, setInitialNetwork] = createSignal<NetworkEnum>(NetworkEnum.TINKERNET);
  const [finalNetworkPair, setFinalNetworkPair] = createSignal<{ from: NetworkEnum; to: NetworkEnum; }>({ from: NetworkEnum.TINKERNET, to: NetworkEnum.TINKERNET });
  const [targetAddress, setTargetAddress] = createSignal<string>('');
  const [bridgeToSelf, setBridgeToSelf] = createSignal<boolean>(false);
  const [isFromDropdownActive, setIsFromDropdownActive] = createSignal(false);
  const [isToDropdownActive, setIsToDropdownActive] = createSignal(false);
  const [isAssetDropdownActive, setIsAssetDropdownActive] = createSignal(false);
  const [balances, setBalances] = createSignal<Array<[string, [string, Balances][]]>>([]);
  const [maxAssetAmount, setMaxAssetAmount] = createSignal<number>(0);
  const [transferableAmount, setTransferableAmount] = createSignal<string>('0.00');
  const [nonTransferableAmount, setNonTransferableAmount] = createSignal<string>('0.00');
  const [totalPortfolioValue, setTotalPortfolioValue] = createSignal<string>('0.00');

  const proposeContext = useProposeContext();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();

  const FROM_TOGGLE_ID = 'networkToggleFrom';
  const FROM_DROPDOWN_ID = 'networkDropdownFrom';
  const $toggleFrom = () => document.getElementById(FROM_TOGGLE_ID);
  const $dropdownFrom = () => document.getElementById(FROM_DROPDOWN_ID);

  const TO_TOGGLE_ID = 'networkToggleTo';
  const TO_DROPDOWN_ID = 'networkDropdownTo';
  const $toggleTo = () => document.getElementById(TO_TOGGLE_ID);
  const $dropdownTo = () => document.getElementById(TO_DROPDOWN_ID);

  const ASSET_TOGGLE_ID = 'assetToggle';
  const ASSET_DROPDOWN_ID = 'assetDropdown';
  const $toggleAsset = () => document.getElementById(ASSET_TOGGLE_ID);
  const $dropdownAsset = () => document.getElementById(ASSET_DROPDOWN_ID);

  const options: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: -6,
    delay: 300,
  };

  const assetOptions: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetDistance: -6,
    delay: 300,
  };

  const allTheNetworks = (): Record<string, JSXElement> => ({
    [NetworkEnum.KUSAMA]: getNetworkBlock(NetworkEnum.KUSAMA),
    [NetworkEnum.POLKADOT]: getNetworkBlock(NetworkEnum.POLKADOT),
    [NetworkEnum.TINKERNET]: getNetworkBlock(NetworkEnum.TINKERNET),
    [NetworkEnum.BASILISK]: getNetworkBlock(NetworkEnum.BASILISK),
    [NetworkEnum.PICASSO]: getNetworkBlock(NetworkEnum.PICASSO),
  });

  const allTheAssets = (): Record<string, JSXElement> => ({
    [AssetEnum.TNKR]: getAssetBlock(AssetEnum.TNKR),
    [AssetEnum.KSM]: getAssetBlock(AssetEnum.KSM),
    [AssetEnum.DOT]: getAssetBlock(AssetEnum.DOT),
    [AssetEnum.BSX]: getAssetBlock(AssetEnum.BSX),
    [AssetEnum.PICA]: getAssetBlock(AssetEnum.PICA),
  });

  const filteredNetworks = createMemo(() => {
    const availableNetworks = balances().map(([network, assets]) => network);
    const allNetworks = Object.entries(allTheNetworks());
    const filteredNetworks = allNetworks.filter(([name, element]) => availableNetworks.includes(name as NetworkEnum));
    return filteredNetworks;
  });

  const filteredAssets = createMemo(() => {
    const pair = finalNetworkPair();
    const allAssets = Object.entries(allTheAssets());
    const assetsFromNetwork = getAssetsFromNetwork(pair.from);
    const filteredAssets = allAssets.filter(([name, element]) => assetsFromNetwork.includes(name as AssetEnum));
    const networksFromBalances = balances().find(([network, assets]) => network == pair.from);
    const filterAssetBlocks = filteredAssets.filter(([name, element]) => networksFromBalances?.[1].map(([asset, balances]) => asset).includes(name as AssetEnum));

    return filterAssetBlocks;
  });

  const filteredAssetCount = () => {
    const pair = finalNetworkPair();
    const allAssets = Object.entries(allTheAssets());
    const assetsFromNetwork = getAssetsFromNetwork(pair.from);
    const filteredAssets = allAssets.filter(([name, element]) => assetsFromNetwork.includes(name as AssetEnum));
    const networksFromBalances = balances().find(([network, assets]) => network == pair.from);
    const filterAssetBlocks = filteredAssets.filter(([name, element]) => networksFromBalances?.[1].map(([asset, balances]) => asset).includes(name as AssetEnum));

    return filterAssetBlocks.length;
  };

  const forNetworks = createMemo(() => {
    // const allNetworks = Object.entries(filteredNetworks());
    // return allNetworks;
    return filteredNetworks();
  });

  const toNetworks = createMemo(() => {
    const balanceNetworks = balances().map(([network, assets]) => network);
    const networks = Object.entries(allTheNetworks()).filter(([name, element]) => balanceNetworks.includes(name as NetworkEnum));
    return networks;
  });

  async function proposeTransfer() {
    const pair = finalNetworkPair();

    if (
      !saturnContext.state.saturn ||
      typeof saturnContext.state.multisigId !== 'number' ||
      !saturnContext.state.multisigAddress ||
      !ringApisContext.state[pair.from] ||
      !asset || new BigNumber(amount()).lte(0)
    ) {
      return;
    }

    if (pair.from == NetworkEnum.TINKERNET && pair.to == NetworkEnum.TINKERNET) {
      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        Rings.tinkernet.decimals,
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.LocalTransfer, { chain: NetworkEnum.TINKERNET, asset: asset(), amount: amountPlank, to: targetAddress() })
      );

    } else if (pair.from == NetworkEnum.TINKERNET && pair.to != NetworkEnum.TINKERNET) {
      // Handle bridging TNKR or KSM from Tinkernet to other chains.
    } else if (pair.from != NetworkEnum.TINKERNET && pair.from != pair.to) {
      // Handle bridging assets between other chains.

      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.XcmBridge, { chain: pair.from, destinationChain: pair.to, asset: asset(), amount: amountPlank, to: bridgeToSelf() ? undefined : targetAddress() })
      );

    } else if (pair.from != NetworkEnum.TINKERNET && pair.from == pair.to) {
      // Handle balance transfer of assets within another chain.

      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.openProposeModal(
        new Proposal(ProposalType.XcmTransfer, { chain: pair.from, asset: asset(), amount: amountPlank, to: targetAddress() })
      );
    }
  };

  function validateAmount(e: any) {
    const inputValue = e.currentTarget.value;

    if (!!inputValue) {
      if (Number(inputValue) <= maxAssetAmount()) {
        setAmount(inputValue);
      } else {
        setAmount(maxAssetAmount());
      }
    } else {
      // Clear the input value or show an error message
      e.currentTarget.value = '';
    }
  }

  function setMaxAmount() {
    const maxAmount = maxAssetAmount();
    setAmount(maxAmount);
  }

  function openAssets() {
    if (dropdownAsset) {
      if (!isAssetDropdownActive()) {
        dropdownAsset.show();
        setIsAssetDropdownActive(true);
      } else {
        closeAssetDropdown();
      }
    }
  }

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

  function closeAssetDropdown() {
    if (dropdownAsset) {
      dropdownAsset.hide();
      setIsAssetDropdownActive(false);
    }
  }

  function handleAssetOptionClick(asset: AssetEnum) {
    setAsset(asset);
    closeAssetDropdown();
  }

  function handleFromOptionClick(from: NetworkEnum) {
    setFinalNetworkPair({ from, to: finalNetworkPair().to });
    // proposeContext.setters.setCurrentNetwork(from);
    closeFromDropdown();
  }

  function handleToOptionClick(to: NetworkEnum) {
    setFinalNetworkPair({ from: finalNetworkPair().from, to });
    closeToDropdown();
  }

  function renderSelectedOption(network: NetworkEnum) {
    return getNetworkBlock(network);
  }

  function renderAssetOption(asset: AssetEnum) {
    return getAssetBlock(asset);
  }

  function clearAddress() {
    setTargetAddress('');
    setBridgeToSelf(false);
  }

  onMount(() => {
    // Initializing the dropdowns
    initDropdowns();
    dropdownFrom = new Dropdown($dropdownFrom(), $toggleFrom(), options);
    dropdownTo = new Dropdown($dropdownTo(), $toggleTo(), options);
    dropdownAsset = new Dropdown($dropdownAsset(), $toggleAsset(), assetOptions);
  });

  createEffect(on(() => saturnContext.state.multisigAddress, () => {
    // Setting all balances whenever multisigAddress changes
    const id = saturnContext.state.multisigId;
    const address = saturnContext.state.multisigAddress;

    if (typeof id !== 'number' || !address) {
      console.log('no multisig id or address');
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
  }));

  // createEffect(on(() => proposeContext.state.currentNetwork, () => {
  //   // Updating the From/To dropdowns when the current network changes
  //   const a = asset();
  //   const n = initialNetwork();
  //   const currentNetwork = proposeContext.state.currentNetwork;

  //   if (a && n && NetworksByAsset[a]) {
  //     setInitialNetwork(n);
  //     if (currentNetwork) {
  //       setFinalNetworkPair({ from: currentNetwork, to: n });
  //       const filterNetworksFromBalances = balances().find(([network, assets]) => network == currentNetwork);
  //       const filterAssetsFromNetwork = filterNetworksFromBalances?.[1].map(([asset, balances]) => asset);

  //       if (filterAssetsFromNetwork && filterAssetsFromNetwork.length > 0) {
  //         const asset = filterAssetsFromNetwork[0];
  //         setAsset(asset as AssetEnum);
  //       }
  //     }
  //   }
  // }));

  createEffect(on(() => finalNetworkPair().from, () => {
    // Updating the From/To dropdowns when the current network changes
    const a = asset();
    const currentNetwork = finalNetworkPair().from;

    if (a && NetworksByAsset[a]) {
      if (currentNetwork) {
        // setFinalNetworkPair({ from: currentNetwork, to: currentNetwork });
        const filterNetworksFromBalances = balances().find(([network, assets]) => network == currentNetwork);
        const filterAssetsFromNetwork = filterNetworksFromBalances?.[1].map(([asset, balances]) => asset);
        console.log('filterAssetsFromNetwork', filterAssetsFromNetwork);
        if (filterAssetsFromNetwork && filterAssetsFromNetwork.length > 0) {
          const asset = filterAssetsFromNetwork[0];
          setAsset(asset as AssetEnum);
        }
      }
    }
  }));

  createEffect(() => {
    // Closing the dropdowns when clicking outside of them
    const handleClickOutside = (event: any) => {
      const toggleToEl = $toggleTo();
      const dropdownToEl = $dropdownTo();
      const toggleFromEl = $toggleFrom();
      const dropdownFromEl = $dropdownFrom();
      const toggleAssetEl = $toggleAsset();
      const dropdownAssetEl = $dropdownAsset();

      if (toggleToEl && dropdownToEl && !toggleToEl.contains(event.target) && !dropdownToEl.contains(event.target)) {
        dropdownTo.hide();
        setIsToDropdownActive(false);
      }

      if (toggleFromEl && dropdownFromEl && !toggleFromEl.contains(event.target) && !dropdownFromEl.contains(event.target)) {
        dropdownFrom.hide();
        setIsFromDropdownActive(false);
      }

      if (toggleAssetEl && dropdownAssetEl && !toggleAssetEl.contains(event.target) && !dropdownAssetEl.contains(event.target)) {
        dropdownAsset.hide();
        setIsAssetDropdownActive(false);
      }
    };

    if (isToDropdownActive() || isFromDropdownActive() || isAssetDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  createEffect(() => {
    // Setting the max asset amount based on the selected asset
    const currentNetwork = finalNetworkPair().from;
    const currentAsset = asset();
    const allBalances = balances();
    const networkBalances = allBalances.find(([network, assets]) => network == currentNetwork);
    const assetBalances = networkBalances?.[1].find(([token, balances]) => token == currentAsset);
    const freeBalance = assetBalances?.[1].freeBalance;

    if (freeBalance) {
      const transferable = formatAsset(freeBalance, Rings[currentNetwork as keyof typeof Rings].decimals);
      // remove commas from transferable string
      const transferableNumber = Number(transferable.replace(/,/g, ''));
      setMaxAssetAmount(transferableNumber);
      // Reset the amount when the asset changes
      setAmount(0);
    }
  });

  createEffect(async () => {
    // Setting My Balance amounts across all balances from current network
    let currentMarketPrice = null;
    const currentNetwork = finalNetworkPair().from;
    const allBalances = balances();
    const networkBalances = allBalances.find(([network, assets]) => network == currentNetwork);

    // Get current market price for token
    const assetInUsd = await getCurrentUsdPrice(currentNetwork);
    if (assetInUsd) {
      currentMarketPrice = new BigNumber(assetInUsd.market_data.current_price.usd);
    } else {
      // If token doesn't exist, use as default conversion
      currentMarketPrice = null;
    }

    // Calculate transferable amount
    const transferable = networkBalances?.[1].reduce((acc, [token, balances]) => {
      const transferable = new BigNumber(balances.freeBalance);
      return acc.plus(transferable);
    }, new BigNumber(0));
    if (transferable) {
      let renderedString = '';
      let transferableNumber = '';
      if (currentMarketPrice !== null) {
        transferableNumber = formatAsset(new BigNumber(transferable).times(currentMarketPrice).toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `$ ${ transferableNumber }`;
      } else {
        transferableNumber = formatAsset(transferable.toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `${ transferableNumber } ${ asset() }`;
      }

      setTransferableAmount(renderedString);
    }

    // Calculate non-transferable amount
    const nonTransferable = networkBalances?.[1].reduce((acc, [token, balances]) => {
      const nonTransferable = new BigNumber(balances.reservedBalance).plus(balances.frozenBalance);
      return acc.plus(nonTransferable);
    }, new BigNumber(0));
    if (nonTransferable) {
      let renderedString = '';
      let nonTransferableNumber = '';
      if (currentMarketPrice !== null) {
        nonTransferableNumber = formatAsset(new BigNumber(nonTransferable).times(currentMarketPrice).toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `$ ${ nonTransferableNumber }`;
      } else {
        nonTransferableNumber = formatAsset(nonTransferable.toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `${ nonTransferableNumber } ${ asset() }`;
      }

      setNonTransferableAmount(renderedString);
    }

    // Calculate total portfolio value
    if (transferable && nonTransferable) {
      let renderedString = '';
      let totalPortfolioNumber = '';
      if (currentMarketPrice !== null) {
        totalPortfolioNumber = formatAsset(new BigNumber(transferable).plus(nonTransferable).times(currentMarketPrice).toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `$ ${ totalPortfolioNumber }`;
      } else {
        totalPortfolioNumber = formatAsset(new BigNumber(transferable).plus(nonTransferable).toString(), Rings[currentNetwork as keyof typeof Rings].decimals);
        renderedString = `${ totalPortfolioNumber } ${ asset() }`;
      }

      setTotalPortfolioValue(renderedString);
    }
  });

  const MyBalance = () => {
    return <dl class="mt-2 text-xs w-full">
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Total Portfolio Value</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">{totalPortfolioValue()}</dd>
      </div>
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Transferable</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">{transferableAmount()}</dd>
      </div>
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">Non-Transferable</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">{nonTransferableAmount()}</dd>
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

        <div class="mb-4">
          <label for="recipient-address" class="text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">Recipient</label>
          <div class="flex flex-row mt-1">
            <input
              type="text"
              id="recipient-address"
              name="recipient-address"
              placeholder="Destination address"
              value={bridgeToSelf() ? saturnContext.state.multisigAddress : targetAddress()}
              class={`rounded-l-md rounded-r-none grow ${ INPUT_COMMON_STYLE }`}
              disabled={bridgeToSelf()}
              onInput={e => setTargetAddress(e.currentTarget.value)}
            />
            <span onClick={clearAddress} class="inline-flex items-center px-3 text-xxs text-saturn-lightgrey bg-gray-200 rounded-r-md dark:bg-gray-800 hover:cursor-pointer opacity-50 hover:opacity-100">
              clear
            </span>
          </div>
          <span class={MINI_TEXT_LINK_STYLE} onClick={() => setBridgeToSelf(!bridgeToSelf())}>use my address</span>
        </div>

        <div class="flex flex-row justify-between items-start">
          <div class="flex flex-col content-between">
            <span class="align-top mb-1 text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">
              Choose Asset
            </span>
            <SaturnSelect disabled={filteredAssetCount() <= 1} isOpen={isAssetDropdownActive()} isMini={true} toggleId={ASSET_TOGGLE_ID} dropdownId={ASSET_DROPDOWN_ID} initialOption={renderAssetOption(asset())} onClick={openAssets}>
              <For each={filteredAssets()}>
                {([name, element]) => <OptionItem onClick={() => handleAssetOptionClick(name as AssetEnum)}>
                  {element}
                </OptionItem>}
              </For>
            </SaturnSelect>
          </div>
          <div class="flex flex-col justify-end">
            <span class="align-top text-right text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">
              <span class={MINI_TEXT_LINK_STYLE} onClick={setMaxAmount}>max</span>
              <span class="ml-2">{maxAssetAmount()} {asset()}</span>
            </span>
            <label for="send-amount" class="sr-only text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">Amount</label>
            <input
              type="number"
              id="send-amount"
              name="send-amount"
              placeholder="0"
              value={Number(amount())}
              class={`${ INPUT_COMMON_STYLE } mt-1`}
              onInput={validateAmount}
              max={Number(maxAssetAmount())}
              min={0}
            />
          </div>
        </div>
      </div>

      <button type="button" class="mt-4 text-sm rounded-md bg-saturn-purple grow px-6 py-3 text-white focus:outline-none hover:bg-purple-800" onClick={proposeTransfer}>Perform Transaction</button>
    </div>;
  };

  return <div class="mb-5">
    <RoundedCard header={`My Balance (${ finalNetworkPair().from.charAt(0).toUpperCase() + finalNetworkPair().from.slice(1) })`}>
      {/* <RoundedCard header="My Balance"> */}
      <MyBalance />
    </RoundedCard>
    <RoundedCard header="Send Crypto">
      <SendCrypto />
    </RoundedCard>
  </div>;
};

AssetsContext.displayName = 'AssetsContext';
export default AssetsContext;