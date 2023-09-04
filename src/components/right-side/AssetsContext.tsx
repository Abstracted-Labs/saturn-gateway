import BigNumber from "bignumber.js";
import { createSignal, createEffect, For, Show, createMemo, lazy } from "solid-js";
import { AssetEnum, NetworksByAsset, Rings } from "../../data/rings";
import { useProposeContext, Proposal, ProposalType } from "../../providers/proposeProvider";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import RoundedCard from "../legos/RoundedCard";
import { Select, SelectTrigger, SelectValue, SelectIcon, SelectContent, SelectListbox, SelectOption, SelectOptionText, SelectOptionIndicator, Input, Switch } from "@hope-ui/solid";
import ChangeNetworkButton from "../top-nav/ChangeNetworkButton";
import SaturnSelect from "../legos/SaturnSelect";
import { NetworkEnum } from "../../utils/consts";

const FromSelect = lazy(() => import('../legos/SaturnSelect'));

const ToSelect = lazy(() => import('../legos/SaturnSelect'));

const AssetsContext = () => {
  const [amount, setAmount] = createSignal<BigNumber>(new BigNumber(0));
  const [asset, setAsset] = createSignal<AssetEnum>(AssetEnum.TNKR);
  const [possibleNetworks, setPossibleNetworks] = createSignal<NetworkEnum[]>([]);
  const [initialNetwork, setInitialNetwork] = createSignal<NetworkEnum>(NetworkEnum.TINKERNET);
  const [finalNetworkPair, setFinalNetworkPair] = createSignal<{ from: NetworkEnum; to: NetworkEnum; }>({ from: NetworkEnum.TINKERNET, to: NetworkEnum.TINKERNET });
  const [targetAddress, setTargetAddress] = createSignal<string>('');
  const [bridgeToSelf, setBridgeToSelf] = createSignal<boolean>(false);
  let leftSelectRef: Element;
  let rightSelectRef: Element;

  const proposeContext = useProposeContext();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();

  createEffect(() => {
    const a = asset();
    const n = initialNetwork();

    if (a && n && NetworksByAsset[a]) {
      setPossibleNetworks(NetworksByAsset[a]);
      setInitialNetwork(n);
      setFinalNetworkPair({ from: n, to: n });
    }
  });

  const proposeTransfer = async () => {
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
      <div class="flex place-items-stretch pb-4 text-saturn-lightgrey">
        <dt class="grow pb-4 border-b border-gray-200 dark:border-gray-700">NFTs</dt>
        <dd class="pb-4 border-b border-saturn-purple text-saturn-black dark:text-saturn-offwhite">69</dd>
      </div>
    </dl>;
  };

  // map new array of possibleNetworks() such that they are wrapped in <span>
  const networks = createMemo(() => {
    return possibleNetworks().map((network) => {
      return <span>{network}</span>;
    });
  });

  const SendCrypto = () => {
    return <div class="flex flex-col w-full">
      <div class='flex flex-col gap-1'>
        <div class='flex flex-row'>
          {/* <FromSelect isMini={true} toggleId="fromToggle" dropdownId="fromDropdown" options={possibleNetworks()} initialOption={finalNetworkPair().from} onOptionClick={(from: NetworkEnum) => setFinalNetworkPair({ from, to: finalNetworkPair().to })} />
          <ToSelect isMini={true} toggleId="toToggle" dropdownId="toDropdown" options={possibleNetworks()} initialOption={finalNetworkPair().to} onOptionClick={(to: NetworkEnum) => setFinalNetworkPair({ from: finalNetworkPair().from, to })} /> */}
          {/* <Select value={finalNetworkPair().from} onChange={v => setFinalNetworkPair({ from: v, to: finalNetworkPair().to })}>
            <SelectTrigger>
              <SelectValue class='capitalize' />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectListbox>
                <For each={possibleNetworks()}>
                  {item => (
                    <SelectOption value={item}>
                      <SelectOptionText class='capitalize'>{item}</SelectOptionText>
                      <SelectOptionIndicator />
                    </SelectOption>
                  )}
                </For>
              </SelectListbox>
            </SelectContent>
          </Select>
          <Select value={finalNetworkPair().to} onChange={v => setFinalNetworkPair({ from: finalNetworkPair().from, to: v })}>
            <SelectTrigger>
              <SelectValue class='capitalize' />
              <SelectIcon />
            </SelectTrigger>
            <SelectContent>
              <SelectListbox>
                <For each={possibleNetworks()}>
                  {item => (
                    <SelectOption value={item}>
                      <SelectOptionText class='capitalize'>{item}</SelectOptionText>
                      <SelectOptionIndicator />
                    </SelectOption>
                  )}
                </For>
              </SelectListbox>
            </SelectContent>
          </Select> */}
        </div>
        {/* <Show when={finalNetworkPair().from != finalNetworkPair().to}>
          <Switch defaultChecked={false} onChange={e => setBridgeToSelf(!bridgeToSelf())}>Bridge To Self</Switch>
        </Show>
        <input
          placeholder='Address'
          value={bridgeToSelf() ? saturnContext.state.multisigAddress : targetAddress()}
          disabled={bridgeToSelf()}
          onInput={e => setTargetAddress(e.currentTarget.value)}
        />
        <input
          placeholder='Amount'
          value={amount().toString()}
          onInput={e => {
            const a = parseInt(e.currentTarget.value);
            if (typeof a === 'number') {
              setAmount(new BigNumber(a));
            }
          }}
        /> */}
      </div>
      {/* <button type="button" class="text-sm rounded-md bg-saturn-purple grow px-6 py-3 text-white focus:outline-none hover:bg-purple-800" onClick={proposeTransfer}>Perform Transaction</button> */}
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