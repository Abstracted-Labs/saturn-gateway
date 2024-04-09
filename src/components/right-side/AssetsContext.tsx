import BigNumber from "bignumber.js";
import { createSignal, createEffect, For, Show, createMemo, JSXElement, onCleanup, on } from "solid-js";
import { AssetEnum, AssetHubEnum, NetworksByAsset, Rings } from "../../data/rings";
import { useProposeContext, Proposal, ProposalType } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import SaturnCard from "../legos/SaturnCard";
import { FALLBACK_TEXT_STYLE, INPUT_COMMON_STYLE, KusamaFeeAssetEnum, MINI_TEXT_LINK_STYLE, NetworkEnum } from "../../utils/consts";
import SaturnSelectItem from "../legos/SaturnSelectItem";
import SaturnSelect from "../legos/SaturnSelect";
import { Dropdown, type DropdownInterface, type DropdownOptions } from "flowbite";
import { getNetworkBlock } from "../../utils/getNetworkBlock";
import { getAssetBlock } from "../../utils/getAssetBlock";
import { getAssetsFromNetwork } from "../../utils/getAssetsFromNetwork";
import { BalanceType } from "../../utils/getBalances";
import { formatAsset } from "../../utils/formatAsset";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import { NetworkAssetBalance } from "../../pages/Assets";
import { getAssetDecimalsFromAssetHubEnum, proposeCall } from "../modals/ProposeModal";
import { FeeAsset } from "@invarch/saturn-sdk";
import getProposalType from "../../utils/getProposalType";
import { useMegaModal } from "../../providers/megaModalProvider";
import { usePriceContext } from "../../providers/priceProvider";
import { useBalanceContext } from "../../providers/balanceProvider";
import { getEncodedAddress } from "../../utils/getEncodedAddress";
import { useToast } from "../../providers/toastProvider";
import { formatBalance } from "@polkadot/util";

const FROM_TOGGLE_ID = 'networkToggleFrom';
const FROM_DROPDOWN_ID = 'networkDropdownFrom';
const TO_TOGGLE_ID = 'networkToggleTo';
const TO_DROPDOWN_ID = 'networkDropdownTo';
const ASSET_TOGGLE_ID = 'assetToggle';
const ASSET_DROPDOWN_ID = 'assetDropdown';

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
  offsetSkidding: 0,
  offsetDistance: -6,
  delay: 300,
};

const notAllowedToSendToTinkernet = [
  NetworkEnum.BASILISK,
  NetworkEnum.PICASSO,
  NetworkEnum.ASSETHUB,
  NetworkEnum.SHIDEN,
  NetworkEnum.KARURA,
  NetworkEnum.MOONRIVER,
  NetworkEnum.KUSAMA,
];

const allTheNetworks = (): Record<string, JSXElement> => ({
  [NetworkEnum.KUSAMA]: getNetworkBlock(NetworkEnum.KUSAMA),
  // [NetworkEnum.POLKADOT]: getNetworkBlock(NetworkEnum.POLKADOT),
  [NetworkEnum.TINKERNET]: getNetworkBlock(NetworkEnum.TINKERNET),
  [NetworkEnum.BASILISK]: getNetworkBlock(NetworkEnum.BASILISK),
  [NetworkEnum.PICASSO]: getNetworkBlock(NetworkEnum.PICASSO),
  [NetworkEnum.ASSETHUB]: getNetworkBlock(NetworkEnum.ASSETHUB),
});

const allTheAssets = (): Record<string, JSXElement> => ({
  [AssetEnum.TNKR]: getAssetBlock(AssetEnum.TNKR),
  [AssetEnum.KSM]: getAssetBlock(AssetEnum.KSM),
  // [AssetEnum.DOT]: getAssetBlock(AssetEnum.DOT),
  [AssetEnum.BSX]: getAssetBlock(AssetEnum.BSX),
  [AssetEnum.PICA]: getAssetBlock(AssetEnum.PICA),
  [AssetEnum.ASSETHUB]: getAssetBlock(AssetEnum.ASSETHUB),
  [AssetHubEnum.BILL]: getAssetBlock(AssetHubEnum.BILL),
  [AssetHubEnum.BAILEGO]: getAssetBlock(AssetHubEnum.BAILEGO),
});

const AssetsContext = () => {
  const fromToggleElement = () => document.getElementById(FROM_TOGGLE_ID);
  const fromDropdownElement = () => document.getElementById(FROM_DROPDOWN_ID);
  const toToggleElement = () => document.getElementById(TO_TOGGLE_ID);
  const toDropdownElement = () => document.getElementById(TO_DROPDOWN_ID);
  const assetToggleElement = () => document.getElementById(ASSET_TOGGLE_ID);
  const assetDropdownElement = () => document.getElementById(ASSET_DROPDOWN_ID);

  const [dropdownFrom, setDropdownFrom] = createSignal<DropdownInterface | null>(null);
  const [dropdownTo, setDropdownTo] = createSignal<DropdownInterface | null>(null);
  const [dropdownAsset, setDropdownAsset] = createSignal<DropdownInterface | null>(null);
  const [amount, setAmount] = createSignal<number>(0);
  const [asset, setAsset] = createSignal<AssetEnum | AssetHubEnum>(AssetEnum.TNKR);
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>(KusamaFeeAssetEnum.TNKR);
  const [finalNetworkPair, setFinalNetworkPair] = createSignal<{ from: NetworkEnum; to: NetworkEnum; }>({ from: NetworkEnum.TINKERNET, to: NetworkEnum.TINKERNET });
  const [targetAddress, setTargetAddress] = createSignal<string>('');
  const [bridgeToSelf, setBridgeToSelf] = createSignal<boolean>(false);
  const [isFromDropdownActive, setIsFromDropdownActive] = createSignal(false);
  const [isToDropdownActive, setIsToDropdownActive] = createSignal(false);
  const [isAssetDropdownActive, setIsAssetDropdownActive] = createSignal(false);
  const [balances, setBalances] = createSignal<NetworkAssetBalance[]>([]);
  const [maxAssetAmount, setMaxAssetAmount] = createSignal<number | null>(null);
  const [transferableAmount, setTransferableAmount] = createSignal<string>('$0.00');
  const [nonTransferableAmount, setNonTransferableAmount] = createSignal<string>('$0.00');
  const [totalPortfolioValue, setTotalPortfolioValue] = createSignal<string>('$0.00');
  const [networkFee, setNetworkFee] = createSignal<number>(0);
  const [loadingFee, setLoadingFee] = createSignal<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = createSignal<boolean>(false);
  const [fromNetworks, setFromNetworks] = createSignal<[string, JSXElement][]>([]);
  const [toNetworks, setToNetworks] = createSignal<[string, JSXElement][]>([]);


  const proposeContext = useProposeContext();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const saContext = useSelectedAccountContext();
  const modalContext = useMegaModal();
  const loc = useLocation();
  const priceContext = usePriceContext();
  const balanceContext = useBalanceContext();
  const toast = useToast();

  const allBalances = createMemo(() => balances());
  const getUsdPrices = createMemo(() => priceContext.prices);
  const hasMultisigs = createMemo(() => saturnContext.state.multisigItems ? saturnContext.state.multisigItems.length > 0 : false);
  const isMultisigId = createMemo(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    return idOrAddress !== 'undefined';
  });
  const filteredAssetCount = createMemo(() => {
    const pair = finalNetworkPair();
    const allAssets = Object.entries(allTheAssets());
    const networksFromBalances = balances().find(([network, _]) => network === pair.from);
    if (!networksFromBalances) return 0;
    const assetNamesInBalances = Object.entries(networksFromBalances[1]).map(([key, value]) => Object.values(value)[0] as string);
    const filteredAssets = assetNamesInBalances
      .map(name => [name, allAssets.find(([assetName, _]) => assetName === name || assetName in AssetHubEnum)?.[1] ?? null])
      .filter(([_, element]) => element !== null);
    return filteredAssets.length;
  });

  const proposeTransfer = () => {
    const pair = finalNetworkPair();

    if (!isLoggedIn()) return;

    if (
      !saturnContext.state.saturn ||
      typeof saturnContext.state.multisigId !== 'number' ||
      !saturnContext.state.multisigAddress ||
      !ringApisContext.state[pair.from] ||
      !asset()
    ) {
      toast.setToast('Error in submitting transfer', 'error', 0);
      return;
    }

    if (notAllowedToSendToTinkernet.includes(pair.from) && pair.to === NetworkEnum.TINKERNET) {
      const source = pair.from.charAt(0).toUpperCase() + pair.from.slice(1);
      toast.setToast(`Cannot send assets from ${ source } to Tinkernet`, 'error', 0);
      return;
    }

    const fromNetwork = pair.from;
    const toNetwork = pair.to;
    const senderAddress = getEncodedAddress(saturnContext.state.multisigAddress, 117);
    const recipientAddress = getEncodedAddress(targetAddress(), 117);
    const selectedAsset = asset();
    const balances = Array.from(allBalances());
    const networkBalances = balances.find(([network, balances]) => {
      return balances.find((balance: any) => {
        const castedBalance = balance as unknown as [string, BalanceType];
        return castedBalance[0] === selectedAsset;
      });
    });
    if (!networkBalances) return;
    const selectBalances = Array.from(networkBalances[1] as unknown as [string, BalanceType][]);
    const selectedAssetBalance = selectBalances.find(([name, _]) => name === selectedAsset);
    const assetDecimals = selectedAssetBalance ? selectedAssetBalance[1].decimals : Rings[fromNetwork as keyof typeof Rings]?.decimals ?? getAssetDecimalsFromAssetHubEnum(selectedAsset as AssetHubEnum) ?? 12;

    if (fromNetwork === toNetwork && senderAddress === recipientAddress) {
      toast.setToast(`Cannot send ${ asset() } to yourself on the same network`, 'error', 0);
      return;
    }

    let bnAmount = new BigNumber(0);

    if (selectedAsset === AssetHubEnum.BAILEGO) {
      bnAmount = new BigNumber(amount());
    } else if (selectedAsset === AssetHubEnum.BILL && assetDecimals) {
      bnAmount = new BigNumber(amount()).multipliedBy(new BigNumber(10).pow(assetDecimals));
    } else {
      bnAmount = new BigNumber(amount()).multipliedBy(new BigNumber(10).pow(Rings[pair.from as keyof typeof Rings]?.decimals ?? 0));
    }

    const amountPlank = new BigNumber(bnAmount.toString().split('.')[0]);

    if (new BigNumber(amount()).lte(0)) {
      toast.setToast('Amount must be greater than zero', 'error', 0);
      return;
    }

    if (new BigNumber(amount()).gt(maxAssetAmount() ?? 0)) {
      toast.setToast('Amount exceeds available balance', 'error', 0);
      return;
    }

    // XcmTransfer: Handle bridging TNKR or KSM from Tinkernet to other chains.
    if (pair.from === NetworkEnum.TINKERNET && pair.to !== NetworkEnum.TINKERNET && selectedAsset) {
      proposeContext.setters.setProposal(
        new Proposal(ProposalType.XcmTransfer, { chain: pair.from, destinationChain: pair.to, asset: selectedAsset, amount: amountPlank, to: targetAddress() })
      );
      console.log('Proposing XCM Transfer from Tinkernet', proposeContext.state.proposal);
      modalContext.showProposeModal();
      return;
    }

    // XcmTransfer: Handle balance transfer of assets within another chain.
    if (pair.from !== NetworkEnum.TINKERNET && pair.from === pair.to && selectedAsset) {
      proposeContext.setters.setProposal(
        new Proposal(ProposalType.XcmTransfer, { chain: pair.from, destinationChain: pair.to, asset: selectedAsset, amount: amountPlank, to: targetAddress() })
      );
      console.log('Proposing XCM Transfer within another chain', proposeContext.state.proposal);
      modalContext.showProposeModal();
      return;
    }

    // LocalTransfer: Handle local transfer of assets within Tinkernet.
    if (pair.from === NetworkEnum.TINKERNET && pair.to === NetworkEnum.TINKERNET && selectedAsset) {
      proposeContext.setters.setProposal(
        new Proposal(ProposalType.LocalTransfer, { chain: pair.from, destinationChain: pair.to, asset: selectedAsset, amount: amountPlank, to: targetAddress() })
      );
      console.log('Proposing Local Transfer within Tinkernet', proposeContext.state.proposal);
      modalContext.showProposeModal();
      return;
    }

    // XcmBridge: Handle bridging assets between other chains.
    if (pair.from !== NetworkEnum.TINKERNET && pair.from !== pair.to && selectedAsset) {
      proposeContext.setters.setProposal(
        new Proposal(ProposalType.XcmBridge, { chain: pair.from, destinationChain: pair.to, asset: selectedAsset, amount: amountPlank, to: targetAddress() })
      );
      console.log('Proposing XCM Bridge from another chain', proposeContext.state.proposal);
      modalContext.showProposeModal();
      return;
    }
  };

  const filteredAssets = () => {
    const pair = finalNetworkPair();
    const allAssets = Object.entries(allTheAssets());
    const networksFromBalances = balances().find(([network, _]) => network === pair.from);
    if (!networksFromBalances) return [];
    const assetNamesInBalances = Object.entries(networksFromBalances[1]).map(([key, value]) => Object.values(value)[0] as string);
    const filteredAssets = assetNamesInBalances
      .map(name => [name, allAssets.find(([assetName, _]) => assetName === name || assetName in AssetHubEnum)?.[1] ?? null])
      .filter(([_, element]) => element !== null);
    return filteredAssets;
  };

  const copySelfAddress = () => {
    if (!isLoggedIn()) return;
    setBridgeToSelf(true);
    if (saturnContext.state.multisigAddress) {
      const nativeAddress = getEncodedAddress(saturnContext.state.multisigAddress, 117);
      setTargetAddress(nativeAddress);
    }
  };

  const validateAmount = (e: any) => {
    const inputValue = e.currentTarget.value;
    if (inputValue === "" || /^(\d+\.?\d*|\.\d*)$/.test(inputValue)) {
      const numericValue = parseFloat(inputValue);
      const maxAmount = maxAssetAmount();
      if (isNaN(numericValue) || maxAmount === null || numericValue > maxAmount) return;
      setAmount(numericValue);
    }
  };

  const setMaxAmount = () => {
    const maxAmount = maxAssetAmount();
    if (maxAmount !== null) {
      setAmount(maxAmount < 1 ? maxAmount : maxAmount - 1);
    }
  };

  const handleAssetsDropdown = () => {
    const dropdown = dropdownAsset();
    if (dropdown && !dropdown.isVisible()) {
      dropdown.init();
      dropdown.show();
      setIsAssetDropdownActive(true);
    } else {
      dropdown?.hide();
      dropdown?.destroy();
      setIsAssetDropdownActive(false);
    }
  };

  const handleFromDropdown = () => {
    const dropdown = dropdownFrom();
    if (dropdown && !dropdown.isVisible()) {
      dropdown.init();
      dropdown.show();
      setIsFromDropdownActive(true);
    } else {
      dropdown?.hide();
      dropdown?.destroy();
      setIsFromDropdownActive(false);
    }
  };

  const handleToDropdown = () => {
    const dropdown = dropdownTo();
    if (dropdown && !dropdown.isVisible()) {
      dropdown.init();
      dropdown.show();
      setIsToDropdownActive(true);
    } else {
      dropdown?.hide();
      dropdown?.destroy();
      setIsToDropdownActive(false);
    }
  };

  const handleAssetOptionClick = (asset: AssetEnum | AssetHubEnum) => {
    setAmount(0);
    setAsset(asset);
  };

  const handleFromOptionClick = (from: NetworkEnum) => {
    setAmount(0);
    setFinalNetworkPair({ from, to: finalNetworkPair().to });
  };

  const handleToOptionClick = (to: NetworkEnum) => {
    setAmount(0);
    setFinalNetworkPair({ from: finalNetworkPair().from, to });
  };

  const renderSelectedOption = (network: NetworkEnum) => {
    return getNetworkBlock(network);
  };

  const renderAssetOption = (asset: AssetEnum | AssetHubEnum | undefined) => {
    const filteredAssetsList = filteredAssets().map(([name, _]) => name);
    return (asset && filteredAssetsList.length > 0 && filteredAssetsList.includes(asset)) ? getAssetBlock(asset) : getAssetBlock(AssetEnum.TNKR);
  };

  const clearAddress = () => {
    if (!isLoggedIn()) return;
    setTargetAddress('');
    setBridgeToSelf(false);
  };

  const updateTargetAddress = (address: string) => {
    if (address !== targetAddress()) {
      setBridgeToSelf(false);
    }

    if (address) {
      const nativeAddress = getEncodedAddress(address, 117);
      setTargetAddress(nativeAddress);
    }
  };

  const getPaymentInfo = async () => {
    const selectedAsset = asset();
    // setLoadingFee(true);

    if (!targetAddress() || !selectedAsset || !amount()) return;

    const bnAmount = new BigNumber(amount().toString()).multipliedBy(new BigNumber('10').pow(Rings[finalNetworkPair().from as keyof typeof Rings]?.decimals ?? 0));

    const finalAmount = new BigNumber(bnAmount.toString().split('.')[0]);

    const proposalProps = {
      preview: true,
      selectedAccountContext: saContext,
      saturnContext,
      proposeContext: {
        state: {
          proposal: {
            proposalType: getProposalType({
              fromChain: finalNetworkPair().from,
              toChain: finalNetworkPair().to,
            }),
            data: {
              chain: finalNetworkPair().from,
              destinationChain: finalNetworkPair().to,
              asset: selectedAsset,
              amount: finalAmount,
              to: targetAddress(),
            }
          },

        },
        setters: proposeContext.setters,
      },
      ringApisContext,
      modalContext,
      message: () => '',
      feeAsset: () => feeAsset() === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay,
      toast
    };

    const paymentInfo = await proposeCall(proposalProps);
    if (paymentInfo) {
      console.log('Payment Info:', paymentInfo);
      const fee = parseFloat(paymentInfo);
      setNetworkFee(fee);
    } else {
      console.error('getPaymentInfo: no payment info');
    }

    // setLoadingFee(false);
  };

  // createEffect(() => {
  //   initDropdowns();
  // });

  createEffect(() => {
    const instance = new Dropdown(fromDropdownElement(), fromToggleElement(), options);
    setDropdownFrom(instance);
  });

  createEffect(() => {
    const instance = new Dropdown(toDropdownElement(), toToggleElement(), options);
    setDropdownTo(instance);
  });

  createEffect(() => {
    const instance = new Dropdown(assetDropdownElement(), assetToggleElement(), assetOptions);
    setDropdownAsset(instance);
  });

  createEffect(() => {
    const feeCurrency = saContext.setters.getFeeAsset();
    setFeeAsset(feeCurrency);
    setNetworkFee(0);
    setAmount(0);
  });

  createEffect(on([() => saturnContext.state.multisigId, () => balanceContext?.balances], () => {
    const id = saturnContext.state.multisigId;

    if (typeof id !== 'number') {
      console.error('Multisig ID is not a number');
      return;
    }

    const allBalances = balanceContext?.balances;
    setBalances(allBalances as unknown as NetworkAssetBalance[]);
  }));

  createEffect(on(finalNetworkPair, () => {
    // Update available assets when the current From network changes
    const currentAsset = asset();
    const balance = allBalances();
    const currentNetwork = finalNetworkPair().from;
    if (currentAsset && currentNetwork && NetworksByAsset[currentAsset]) {
      const filterNetworksFromBalances = balance.find(([network, _]) => network == currentNetwork);
      if (filterNetworksFromBalances && Array.isArray(filterNetworksFromBalances[1])) {
        const filterAssetsFromNetwork: BalanceType[] = filterNetworksFromBalances[1];
        if (filterAssetsFromNetwork.length > 0) {
          const asset = filterAssetsFromNetwork[0];
          const balances = asset as unknown as [string, BalanceType];
          setAsset(balances[0] as AssetEnum | AssetHubEnum);
        }
      }
    }
  }));

  createEffect(() => {
    // Handle AssetHub/Tinkernet pairing options
    const networkPair = finalNetworkPair();
    let selectedFromNetwork = networkPair.from;
    let selectedToNetwork = networkPair.to;
    const allFromNetworks = Object.entries(allTheNetworks());
    const allToNetworks = Object.entries(allTheNetworks());

    const filteredFromNetworks = allFromNetworks.filter(([name, _]) => {
      // if (selectedToNetwork === NetworkEnum.ASSETHUB && selectedFromNetwork !== NetworkEnum.ASSETHUB) {
      //   return name !== NetworkEnum.TINKERNET;
      // }
      // if (selectedToNetwork === NetworkEnum.TINKERNET && selectedFromNetwork !== NetworkEnum.TINKERNET) {
      //   return name !== NetworkEnum.ASSETHUB;
      // }
      return name !== selectedFromNetwork;
    });

    const filteredToNetworks = allToNetworks.filter(([name, _]) => {
      // if (selectedFromNetwork === NetworkEnum.TINKERNET && selectedToNetwork !== NetworkEnum.TINKERNET) {
      //   return name !== NetworkEnum.ASSETHUB;
      // }
      // if (selectedFromNetwork === NetworkEnum.ASSETHUB && selectedToNetwork !== NetworkEnum.ASSETHUB) {
      //   return name !== NetworkEnum.TINKERNET;
      // }
      return name !== selectedToNetwork;
    });


    if (filteredFromNetworks.length > 0 && selectedFromNetwork === NetworkEnum.TINKERNET && selectedToNetwork === NetworkEnum.ASSETHUB) {
      const firstAvailableNetwork = filteredFromNetworks.find(([name, _]) => name !== NetworkEnum.ASSETHUB);
      if (firstAvailableNetwork) {
        selectedFromNetwork = firstAvailableNetwork[0] as NetworkEnum;
        setFinalNetworkPair({ from: selectedFromNetwork, to: selectedToNetwork });
        toast.setToast('Cannot send assets from Tinkernet to AssetHub', 'error', 0);
      }
    }

    if (filteredToNetworks.length > 0 && selectedToNetwork === NetworkEnum.TINKERNET && notAllowedToSendToTinkernet.includes(selectedFromNetwork)) {
      const alternativeNetwork = filteredToNetworks.find(([name, _]) => !notAllowedToSendToTinkernet.includes(name as NetworkEnum));
      console.log('alternativeNetwork', alternativeNetwork);
      if (alternativeNetwork) {
        selectedToNetwork = alternativeNetwork[0] as NetworkEnum;
        console.log('selectedToNetwork', selectedToNetwork);
        setFinalNetworkPair({ from: selectedFromNetwork, to: selectedToNetwork });
        toast.setToast(`Cannot send assets from ${ selectedFromNetwork } to Tinkernet`, 'error', 0);
      }
    }

    setFromNetworks(filteredFromNetworks);
    setToNetworks(filteredToNetworks);
  });

  createEffect(() => {
    // Setting max asset amount if available
    const currentNetwork = finalNetworkPair().from;
    const currentAsset = asset();
    const userBalances = allBalances();
    const networkBalances: NetworkAssetBalance | undefined = userBalances.find(([network, assets]) => network == currentNetwork);
    if (networkBalances && Array.isArray(networkBalances[1])) {
      const balanceArray = networkBalances[1];
      const assetBalances = (balanceArray as unknown as [string, BalanceType][]).find(([token, balances]) => token === currentAsset);

      if (assetBalances) {
        const freeBalance = assetBalances?.[1].freeBalance;
        const assetDecimals = assetBalances?.[1].decimals ?? Rings[currentNetwork as keyof typeof Rings]?.decimals ?? 12;

        if (freeBalance) {
          let transferableNumber;
          if (currentAsset === AssetHubEnum.BAILEGO) {
            transferableNumber = Number(freeBalance);
          } else {
            const transferable = formatAsset(freeBalance, assetDecimals, 4);
            transferableNumber = Number(transferable.replace(/,/g, ''));
          }
          setMaxAssetAmount(transferableNumber);
          setAmount(0);
        } else {
          setMaxAssetAmount(null);
        }
      } else {
        setMaxAssetAmount(null);
      }
    } else {
      setMaxAssetAmount(null);
    }
  });

  createEffect(() => {
    setIsLoggedIn(!!saContext.state.account?.address);
  });

  createEffect(() => {
    const allPrices = getUsdPrices();

    const loadAllBalances = async () => {
      if (!allPrices) return;

      let sumTransferable = new BigNumber(0);
      let sumNonTransferable = new BigNumber(0);
      let sumTotalPortfolio = new BigNumber(0);

      for (const [network, assets] of balances()) {
        const decimals = Rings[network as keyof typeof Rings]?.decimals ?? 12;

        for (const [assetName, balance] of assets as unknown as [string, BalanceType][]) {
          let currentMarketPrice = new BigNumber(0);

          // Apply logic from convertAssetTotalToUsd
          if (assetName === AssetEnum.TNKR) {
            const tnkrPrice = allPrices[network as NetworkEnum]?.usd;
            if (tnkrPrice && new BigNumber(tnkrPrice).isGreaterThan(0)) {
              currentMarketPrice = new BigNumber(tnkrPrice);
            }
          } else {
            const specificNetworkPrice = allPrices[network as NetworkEnum]?.usd;
            if (specificNetworkPrice && new BigNumber(specificNetworkPrice).isGreaterThan(0)) {
              currentMarketPrice = new BigNumber(specificNetworkPrice);
            } else {
              let networksHoldingAsset = NetworksByAsset[assetName as AssetEnum];
              if (!networksHoldingAsset) {
                networksHoldingAsset = NetworksByAsset[AssetEnum.ASSETHUB];
              }
              for (const net of networksHoldingAsset) {
                const price = allPrices[net as NetworkEnum]?.usd;
                if (price && new BigNumber(price).isGreaterThan(0)) {
                  currentMarketPrice = new BigNumber(price);
                  break;
                }
              }
            }
          }

          // Continue with balance calculations
          if (currentMarketPrice.isGreaterThan(0)) {
            const transferable = new BigNumber(balance.freeBalance).dividedBy(new BigNumber(10).pow(decimals));
            const totalLockAmount = balance.locks && balance.locks.length > 0
              ? balance.locks.reduce((acc, lock) => acc.plus(new BigNumber(lock.amount.toString())), new BigNumber(0)).dividedBy(new BigNumber(10).pow(decimals))
              : new BigNumber(0);
            const nonTransferable = new BigNumber(balance.reservedBalance).plus(totalLockAmount).dividedBy(new BigNumber(10).pow(decimals));

            sumTransferable = sumTransferable.plus(transferable.times(currentMarketPrice));
            sumNonTransferable = sumNonTransferable.plus(nonTransferable.times(currentMarketPrice));
            sumTotalPortfolio = sumTotalPortfolio.plus(transferable.plus(nonTransferable).times(currentMarketPrice));
          }
        }
      }

      // Format and set the calculated values
      const formatValue = (value: BigNumber) => `$${ value.isGreaterThan(0) ? value.toFixed(2) : '0.00' }`;

      setTransferableAmount(formatValue(sumTransferable));
      setNonTransferableAmount(formatValue(sumNonTransferable));
      setTotalPortfolioValue(formatValue(sumTotalPortfolio));
    };

    loadAllBalances();
  });

  createEffect(() => {
    const toToggle = toToggleElement();
    const toDropdown = toDropdownElement();
    const dropdown = dropdownTo();

    const handleClickOutside = (event: any) => {
      if (!toToggle || !toDropdown || !dropdown) return;
      if (toToggle && toDropdown && !toToggle.contains(event.target) && !toDropdown.contains(event.target)) {
        dropdown.hide();
        dropdown.destroy();
        setIsToDropdownActive(false);
      } else {
        dropdown.init();
        dropdown.show();
        setIsToDropdownActive(true);
      }
    };

    if (isToDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  createEffect(() => {
    const fromToggle = fromToggleElement();
    const fromDropdown = fromDropdownElement();
    const dropdown = dropdownFrom();

    const handleClickOutside = (event: any) => {
      if (!fromToggle || !fromDropdown || !dropdown) return;
      if (fromToggle && fromDropdown && !fromToggle.contains(event.target) && !fromDropdown.contains(event.target)) {
        dropdown.hide();
        dropdown.destroy();
        setIsFromDropdownActive(false);
      } else {
        dropdown.init();
        dropdown.show();
        setIsToDropdownActive(true);
      }
    };

    if (isFromDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  createEffect(() => {
    const assetToggle = assetToggleElement();
    const assetDropdown = assetDropdownElement();
    const dropdown = dropdownAsset();

    const handleClickOutside = (event: any) => {
      if (!assetToggle || !assetDropdown || !dropdown) return;
      if (assetToggle && assetDropdown && !assetToggle.contains(event.target) && !assetDropdown.contains(event.target)) {
        dropdown.hide();
        dropdown.destroy();
        setIsAssetDropdownActive(false);
      } else {
        dropdown.init();
        dropdown.show();
        setIsToDropdownActive(true);
      }
    };

    if (isAssetDropdownActive()) {
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
          <span class="text-xxs text-saturn-lightgrey">from</span>
          <SaturnSelect isOpen={isFromDropdownActive()} isMini={true} toggleId={FROM_TOGGLE_ID} dropdownId={FROM_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().from)} onClick={handleFromDropdown}>
            <For each={fromNetworks()}>
              {([name, element]) => element !== null && <SaturnSelectItem onClick={() => {
                handleFromOptionClick(name as NetworkEnum);
                getPaymentInfo();
              }}>
                {element}
              </SaturnSelectItem>}
            </For>
          </SaturnSelect>
          <span class="text-xxs text-saturn-lightgrey">to</span>
          <SaturnSelect isOpen={isToDropdownActive()} isMini={true} toggleId={TO_TOGGLE_ID} dropdownId={TO_DROPDOWN_ID} initialOption={renderSelectedOption(finalNetworkPair().to)} onClick={handleToDropdown}>
            <For each={toNetworks()}>
              {([name, element]) => element !== null && <SaturnSelectItem onClick={() => {
                handleToOptionClick(name as NetworkEnum);
                getPaymentInfo();
              }}>
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
              value={targetAddress()}
              class={`rounded-l-md rounded-r-none grow focus:outline-none focus:ring-0  focus:ring-saturn-purple ${ INPUT_COMMON_STYLE }`}
              disabled={!isLoggedIn()}
              onInput={e => updateTargetAddress(e.currentTarget.value)}
              onBlur={getPaymentInfo}
              onMouseLeave={getPaymentInfo}
            />
            <span onClick={clearAddress} class="inline-flex items-center px-3 text-xxs text-saturn-lightgrey bg-gray-200 rounded-r-md dark:bg-gray-800 hover:cursor-pointer opacity-50 hover:opacity-100 border border-gray-700">
              clear
            </span>
          </div>
          <Show when={finalNetworkPair().from !== finalNetworkPair().to}>
            <span class={MINI_TEXT_LINK_STYLE} onClick={copySelfAddress} onMouseLeave={getPaymentInfo}>use omnisig address</span>
          </Show>
        </div>

        <div class="flex flex-row justify-between items-start">
          <div class="flex flex-col content-between">
            <span class="align-top mb-1 text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">
              Choose Asset
            </span>
            <SaturnSelect disabled={filteredAssetCount() <= 1} isOpen={isAssetDropdownActive()} isMini={true} toggleId={ASSET_TOGGLE_ID} dropdownId={ASSET_DROPDOWN_ID} initialOption={renderAssetOption(asset())} onClick={handleAssetsDropdown}>
              <For each={filteredAssets()}>
                {([name, _]) => {
                  const displayElement = getAssetBlock(name as AssetEnum | AssetHubEnum);
                  return displayElement && <SaturnSelectItem onClick={() => {
                    handleAssetOptionClick(name as AssetEnum | AssetHubEnum);
                    getPaymentInfo();
                  }}>
                    {displayElement}
                  </SaturnSelectItem>;
                }}
              </For>
            </SaturnSelect>
          </div>
          <div class="flex flex-col justify-end">
            <Show when={!!asset()} fallback={<div class={FALLBACK_TEXT_STYLE}>--</div>}>
              <span class="align-top text-right text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">
                <Show when={maxAssetAmount() !== null} fallback={
                  <div class={FALLBACK_TEXT_STYLE}>--</div>
                }>
                  <span class={MINI_TEXT_LINK_STYLE} onClick={setMaxAmount} onMouseLeave={getPaymentInfo}>max</span>
                  <span class="ml-2">{maxAssetAmount()} {asset()}</span>
                </Show>
              </span>
            </Show>
            <label for="send-amount" class="sr-only text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">Amount</label>
            <input
              type="number"
              id="send-amount"
              name="send-amount"
              placeholder="0"
              value={Number(amount())}
              class={`${ INPUT_COMMON_STYLE } mt-1`}
              onInput={validateAmount}
              onBlur={getPaymentInfo}
              onMouseLeave={getPaymentInfo}
              max={Number(maxAssetAmount())}
              min={0}
              disabled={!isLoggedIn() || !maxAssetAmount()}
            />
          </div>
        </div>

        {/* <div class="flex flex-row justify-between mt-1">
          <span class="text-xxs text-saturn-lightgrey dark:text-saturn-lightgrey">
            Network Fee
          </span>
          <div class="flex flex-col justify-end">
            <span class="align-top text-right text-xxs text-saturn-darkgrey dark:text-saturn-offwhite">
              <Show when={!!maxAssetAmount()} fallback={<div class={FALLBACK_TEXT_STYLE}>--</div>}>
                <span class="ml-2">{networkFee()} {feeAsset()}</span>
              </Show>
            </span>
          </div>
        </div> */}
      </div>

      <button type="button" class={`mt-4 text-sm rounded-md bg-saturn-purple grow px-6 py-3 text-white focus:outline-none hover:bg-purple-800 disabled:opacity-25 disabled:cursor-not-allowed`} disabled={!isLoggedIn() || !hasMultisigs() || !isMultisigId() || !maxAssetAmount()} onClick={proposeTransfer}>Propose Transaction</button>
    </div>;
  };

  return <div class="mb-5">
    <SaturnCard header="My Balance">
      <MyBalance />
    </SaturnCard>
    <SaturnCard header="Send Crypto">
      <SendCrypto />
    </SaturnCard>
  </div>;
};

AssetsContext.displayName = 'AssetsContext';
export default AssetsContext;