import BigNumber from "bignumber.js";
import { createSignal, createEffect, For, Show, createMemo, lazy, onMount, JSXElement, onCleanup, on } from "solid-js";
import { AssetEnum, NetworksByAsset, Rings } from "../../data/rings";
import { useProposeContext, Proposal, ProposalType } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import SaturnCard from "../legos/SaturnCard";
import { FALLBACK_TEXT_STYLE, INPUT_COMMON_STYLE, MINI_TEXT_LINK_STYLE, NetworkEnum } from "../../utils/consts";
import SaturnSelectItem from "../legos/SaturnSelectItem";
import SaturnSelect from "../legos/SaturnSelect";
import { initDropdowns, Dropdown, type DropdownInterface, type DropdownOptions } from "flowbite";
import { getNetworkBlock } from "../../utils/getNetworkBlock";
import { getAssetBlock } from "../../utils/getAssetBlock";
import { getAssetsFromNetwork } from "../../utils/getAssetsFromNetwork";
import { BalanceType, getBalancesFromAllNetworks } from "../../utils/getBalances";
import { formatAsset } from "../../utils/formatAsset";
import { getCurrentUsdPrice } from "../../utils/getCurrentUsdPrice";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import { NetworkAssetBalance, NetworkBalancesArray } from "../../pages/Assets";

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
  const [balances, setBalances] = createSignal<NetworkAssetBalance[]>([]);
  const [maxAssetAmount, setMaxAssetAmount] = createSignal<number | null>(null);
  const [transferableAmount, setTransferableAmount] = createSignal<string>('0.00');
  const [nonTransferableAmount, setNonTransferableAmount] = createSignal<string>('0.00');
  const [totalPortfolioValue, setTotalPortfolioValue] = createSignal<string>('0.00');
  const [networkFee, setNetworkFee] = createSignal<number>(0.0005);

  const proposeContext = useProposeContext();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const saContext = useSelectedAccountContext();
  const loc = useLocation();

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
    const filterAssetBlocks = filteredAssets.filter(([name, element]) => Object.keys(networksFromBalances?.[1] || {}).includes(name));

    return filterAssetBlocks;
  });
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
  const isLoggedIn = createMemo(() => !!saContext.state.account?.address);
  const hasMultisigs = createMemo(() => saturnContext.state.multisigItems ? saturnContext.state.multisigItems.length > 0 : false);
  const isMultisigId = createMemo(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    return idOrAddress !== 'undefined';
  });

  function filteredAssetCount() {
    const pair = finalNetworkPair();
    const allAssets = Object.entries(allTheAssets());
    const assetsFromNetwork = getAssetsFromNetwork(pair.from);
    const filteredAssets = allAssets.filter(([name, element]) => assetsFromNetwork.includes(name as AssetEnum));
    const networksFromBalances = balances().find(([network, assets]) => network == pair.from);
    const filterAssetBlocks = filteredAssets.filter(([name, element]) => Object.keys(networksFromBalances?.[1] || {}).includes(name));

    return filterAssetBlocks.length;
  };

  async function proposeTransfer() {
    const pair = finalNetworkPair();

    if (!isLoggedIn()) {
      console.error('proposeTransfer: not logged in');
      return;
    }

    if (
      !saturnContext.state.saturn ||
      typeof saturnContext.state.multisigId !== 'number' ||
      !saturnContext.state.multisigAddress ||
      !ringApisContext.state[pair.from] ||
      !asset || new BigNumber(amount()).lte(0)
    ) {
      console.error('proposeTransfer: missing data');
      return;
    }

    if (pair.from == NetworkEnum.TINKERNET && pair.to == NetworkEnum.TINKERNET) {
      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        Rings.tinkernet.decimals,
      ));

      proposeContext.setters.setProposal(
        new Proposal(ProposalType.LocalTransfer, { chain: NetworkEnum.TINKERNET, asset: asset(), amount: amountPlank, to: targetAddress() })
      );

    } else if (pair.from == NetworkEnum.TINKERNET && pair.to != NetworkEnum.TINKERNET) {
      // TODO: Handle bridging TNKR or KSM from Tinkernet to other chains.
    } else if (pair.from != NetworkEnum.TINKERNET && pair.from != pair.to) {
      // Handle bridging assets between other chains.

      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.setProposal(
        new Proposal(ProposalType.XcmBridge, { chain: pair.from, destinationChain: pair.to, asset: asset(), amount: amountPlank, to: bridgeToSelf() ? undefined : targetAddress() })
      );

    } else if (pair.from != NetworkEnum.TINKERNET && pair.from == pair.to) {
      // Handle balance transfer of assets within another chain.

      const amountPlank = new BigNumber(amount()).times(BigNumber('10').pow(
        BigNumber(Rings[pair.from as keyof typeof Rings].decimals),
      ));

      proposeContext.setters.setProposal(
        new Proposal(ProposalType.XcmTransfer, { chain: pair.from, asset: asset(), amount: amountPlank, to: targetAddress() })
      );
    }

    // Open proposal modal
    proposeContext.setters.setOpenProposeModal(true);
  };

  function copySelfAddress() {
    if (!isLoggedIn()) return;
    setBridgeToSelf(!bridgeToSelf());
  }

  function validateAmount(e: any) {
    const inputValue = e.currentTarget.value;
    const maxAmount = maxAssetAmount();
    if (maxAmount === null) return;
    if (!!inputValue) {
      if (Number(inputValue) <= maxAmount) {
        setAmount(inputValue);
      } else {
        setAmount(maxAmount);
      }
    } else {
      // Clear the input value or show an error message
      e.currentTarget.value = '';
    }
  }

  function setMaxAmount() {
    const maxAmount = maxAssetAmount();
    if (maxAmount === null || maxAmount <= 1) return;
    setAmount(maxAmount - 1);
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
    if (!isLoggedIn()) return;
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
      return;
    }

    const runAsync = async () => {
      const nb = await getBalancesFromAllNetworks(address);
      const remapped = Object.entries(nb).map(([network, assets]) => {
        const ret: [string, [string, NetworkBalancesArray][]] = [network,
          Object.entries(assets)
            .map(([asset, assetBalances]) => {
              const ret: [string, NetworkBalancesArray] = [asset, assetBalances as unknown as NetworkBalancesArray];
              return ret;
            })
            .filter(([_, allBalances]) => {
              const assetBalances = allBalances as unknown as BalanceType;
              const totalLockAmount = assetBalances.locks.reduce((acc, lock) => acc + parseInt(lock.amount), 0).toString();
              const hasBalances = assetBalances.freeBalance != '0'
                || assetBalances.reservedBalance != '0'
                || (+totalLockAmount !== 0);
              return hasBalances;
            })];
        return ret;
      });

      setBalances(remapped as unknown as NetworkAssetBalance[]);
    };

    runAsync();
  }));

  createEffect(on([() => finalNetworkPair().from, balances, asset], () => {
    // Updating the From/To dropdowns when the current network changes
    const currentAsset = asset();
    const balance = balances();
    const currentNetwork = finalNetworkPair().from;
    if (currentAsset && currentNetwork && NetworksByAsset[currentAsset]) {
      // setFinalNetworkPair({ from: currentNetwork, to: currentNetwork });
      const filterNetworksFromBalances = balance.find(([network, _]) => network == currentNetwork);
      if (filterNetworksFromBalances && Array.isArray(filterNetworksFromBalances[1])) {
        const filterAssetsFromNetwork: BalanceType[] = filterNetworksFromBalances[1];
        if (filterAssetsFromNetwork.length > 0) {
          const asset = filterAssetsFromNetwork[0];
          const balances = asset as unknown as [string, BalanceType];
          setAsset(balances[0] as AssetEnum);
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
    const networkBalances: NetworkAssetBalance | undefined = allBalances.find(([network, assets]) => network == currentNetwork);
    if (networkBalances && Array.isArray(networkBalances[1])) {
      const balanceArray = networkBalances[1];
      const assetBalances = (balanceArray as unknown as [string, BalanceType][]).find(([token, balances]) => token === currentAsset);
      if (assetBalances) {
        const freeBalance = assetBalances?.[1].freeBalance;
        if (freeBalance) {
          const transferable = formatAsset(freeBalance, Rings[currentNetwork as keyof typeof Rings].decimals);
          // remove commas from transferable string
          const transferableNumber = Number(transferable.replace(/,/g, ''));
          setMaxAssetAmount(transferableNumber);
          // Reset the amount when the asset changes
          setAmount(0);
        } else {
          setMaxAssetAmount(null);
        }
      }
    }
  });

  createEffect(async () => {
    // Setting My Balance amounts across all balances from current network
    let currentMarketPrice = null;
    const currentNetwork = finalNetworkPair().from;
    const allBalances = balances();

    const networkBalances: NetworkAssetBalance | undefined = allBalances.find(([network, assets]) => network == currentNetwork);
    if (!networkBalances || !Array.isArray(networkBalances[1])) {
      return;
    }

    const balanceArray = networkBalances[1];

    // Get current market price for token
    const assetInUsd = await getCurrentUsdPrice(currentNetwork);
    if (assetInUsd) {
      currentMarketPrice = new BigNumber(assetInUsd.market_data.current_price.usd);
    } else {
      // If token doesn't exist, use as default conversion
      currentMarketPrice = null;
    }

    // Calculate transferable amount
    const transferable = (balanceArray as unknown as [string, BalanceType][]).reduce((acc, [token, balances]) => {
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
    const nonTransferable = (balanceArray as unknown as [string, BalanceType][]).reduce((acc, [token, balances]) => {
      const totalLockAmount = balances.locks.reduce((acc, lock) => acc + parseInt(lock.amount), 0).toString();
      const nonTransferable = new BigNumber(balances.reservedBalance).plus(new BigNumber(totalLockAmount));
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
          <SaturnSelect disabled={!isLoggedIn()} isOpen={isFromDropdownActive()} isMini={true} toggleId={FROM_TOGGLE_ID} dropdownId={FROM_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().from)} onClick={openFrom}>
            <For each={forNetworks()}>
              {([name, element]) => <SaturnSelectItem onClick={() => handleFromOptionClick(name as NetworkEnum)}>
                {element}
              </SaturnSelectItem>}
            </For>
          </SaturnSelect>
          <span class="text-xs text-saturn-darkgrey dark:text-saturn-offwhite">to</span>
          <SaturnSelect disabled={!isLoggedIn()} isOpen={isToDropdownActive()} isMini={true} toggleId={TO_TOGGLE_ID} dropdownId={TO_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().to)} onClick={openTo}>
            <For each={toNetworks()}>
              {([name, element]) => <SaturnSelectItem onClick={() => handleToOptionClick(name as NetworkEnum)}>
                {element}
              </SaturnSelectItem>}
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
              disabled={bridgeToSelf() || !isLoggedIn()}
              onInput={e => setTargetAddress(e.currentTarget.value)}
            />
            <span onClick={clearAddress} class="inline-flex items-center px-3 text-xxs text-saturn-lightgrey bg-gray-200 rounded-r-md dark:bg-gray-800 hover:cursor-pointer opacity-50 hover:opacity-100">
              clear
            </span>
          </div>
          <span class={MINI_TEXT_LINK_STYLE} onClick={copySelfAddress}>use my address</span>
        </div>

        <div class="flex flex-row justify-between items-start">
          <div class="flex flex-col content-between">
            <span class="align-top mb-1 text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">
              Choose Asset
            </span>
            <SaturnSelect disabled={filteredAssetCount() <= 1 || !isLoggedIn()} isOpen={isAssetDropdownActive()} isMini={true} toggleId={ASSET_TOGGLE_ID} dropdownId={ASSET_DROPDOWN_ID} initialOption={renderAssetOption(asset())} onClick={openAssets}>
              <For each={filteredAssets()}>
                {([name, element]) => <SaturnSelectItem onClick={() => handleAssetOptionClick(name as AssetEnum)}>
                  {element}
                </SaturnSelectItem>}
              </For>
            </SaturnSelect>
          </div>
          <div class="flex flex-col justify-end">
            <span class="align-top text-right text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">
              <Show when={maxAssetAmount() !== null} fallback={
                <div class={FALLBACK_TEXT_STYLE}>--</div>
              }>
                <span class={MINI_TEXT_LINK_STYLE} onClick={setMaxAmount}>max</span>
                <span class="ml-2">{maxAssetAmount()} {asset()}</span>
              </Show>
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
              disabled={!isLoggedIn()}
            />
          </div>
        </div>

        <div class="flex flex-row justify-between mt-1">
          <span class="text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">
            Network Fee
          </span>
          <div class="flex flex-col justify-end">
            <span class="align-top text-right text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">
              <Show when={!!maxAssetAmount()} fallback={<div class={FALLBACK_TEXT_STYLE}>--</div>}>
                <span class="ml-2">{networkFee()} {asset()}</span>
              </Show>
            </span>
          </div>
        </div>
      </div>

      <button type="button" class={`mt-4 text-sm rounded-md bg-saturn-purple grow px-6 py-3 text-white focus:outline-none hover:bg-purple-800 disabled:opacity-25 disabled:cursor-not-allowed`} disabled={!isLoggedIn() || !hasMultisigs() || !isMultisigId()} onClick={proposeTransfer}>Perform Transaction</button>
    </div>;
  };

  return <div class="mb-5">
    <SaturnCard header={`My Balance (${ finalNetworkPair().from.charAt(0).toUpperCase() + finalNetworkPair().from.slice(1) })`}>
      {/* <RoundedCard header="My Balance"> */}
      <MyBalance />
    </SaturnCard>
    <SaturnCard header="Send Crypto">
      <SendCrypto />
    </SaturnCard>
  </div>;
};

AssetsContext.displayName = 'AssetsContext';
export default AssetsContext;