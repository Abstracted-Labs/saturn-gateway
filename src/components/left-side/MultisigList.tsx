import { randomAsHex } from '@polkadot/util-crypto';
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { stringShorten } from '@polkadot/util';
import { createSignal, createEffect, For, onCleanup, Show, JSXElement, createMemo } from 'solid-js';
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";

import { useThemeContext } from '../../providers/themeProvider';
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { Rings } from "../../data/rings";
import { useRingApisContext } from "../../providers/ringApisProvider";

type MultisigItem = {
  id: number;
  copyIcon: JSXElement;
  address: string,
  capitalizedFirstName: string;
  image?: string;
  activeTransactions: number;
};


function capitalizeFirstName(name: string): string {
  const words = name.trim().split(" ");
  const capitalizedWords = words.map((word) => {
    if (!isNaN(Number(word))) {
      return word; // Skip capitalization if the word is a number
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  return capitalizedWords.join(" ");
}

const MultisigList = () => {
  let scrollContainerRef: HTMLDivElement | null = null;
  const theme = useThemeContext();
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const [activeButton, setActiveButton] = createSignal<number | null>(null);
  const [multisigItems, setMultisigItems] = createSignal<Array<any>>([]);
  const [originalOrder, setOriginalOrder] = createSignal([...multisigItems()]);
  const [copiedIndex, setCopiedIndex] = createSignal<number | null>(null);
  // const [selectedItem, setSelectedItem] = createSignal<MultisigItem | null>

    const saturnContext = useSaturnContext();
    const selectedAccountContext = useSelectedAccountContext();
    const ringApisContext = useRingApisContext();

    function handleClick(index: number) {
        const multisig = multisigItems()[index];
      const selectedAddress = multisig.address;
      const id = multisig.id;

    if (activeButton() === id) {
      // If the clicked item is already active, restore the original order
      // setMultisigItems(originalOrder);
      // setActiveButton(null);
      // setSelectedItem(null); // Clear the selected item
      return; // Do nothing if the clicked item is already active
    } else {
      setActiveButton(id);

        // TODO: Set multisig in saturn provider and set the URL to /#/id

      // Remove the selected item from the list and update the selected item
      const selectedItem = originalOrder()[index];
      setMultisigItems(originalOrder());
      // setSelectedItem(selectedItem); // Update the selected item
    }

    // Reset the scroll position
    // const scrollContainer = scrollContainerRef;
    // if (scrollContainer instanceof HTMLDivElement) {
    //   scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    // }
  }

  function setScrollContainerRef(ref: HTMLDivElement | null) {
    scrollContainerRef = ref;
  };

  function copyAddressToClipboard(e: MouseEvent, selectedAddress: string, index: number) {
    // Prevent the click event from bubbling up to the parent element
    e.stopPropagation();

    // Copy the address to the clipboard
    navigator.clipboard.writeText(selectedAddress);

    // Set the copiedIndex state to the index of the copied item
    setCopiedIndex(index);

    // Revert the isCopied state back to false after 5 seconds
    setTimeout(() => {
      setCopiedIndex(null);
    }, 5000);
  }

  createEffect(() => {
    setOriginalOrder([...multisigItems()]);
  });

    createEffect(() => {
        const sat = saturnContext.state.saturn;
        const acc = selectedAccountContext.state.account?.address;
        const api = ringApisContext.state.tinkernet;
        if (!sat || !acc || !api) return;

        const runAsync = async () => {
            const multisigs = await sat.getMultisigsForAccount(acc);

            const processedList = await Promise.all(multisigs.map(async (m) => {
                // We calculate the address locally instead of wasting time fetching from the chain.
                // The v2 of the Saturn SDK should have a function to calculate the address.
                const address = encodeAddress(
                    blake2AsU8a(
                        api.createType("(H256, u32)", [Rings.tinkernet.genesisHash, m.multisigId]).toU8a(), 256
                    ), 117);

                const iden = await api.query.identity.identityOf(address).then((i) => (i?.toHuman() as {
                        info: {
                            display: { Raw: string };
                            image: { Raw: string };
                        };
                    }).info);

                const name = iden?.display?.Raw || `Multisig ${ m.multisigId }`;

                const image = iden?.image?.Raw;

                const copyIcon = <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />;


                // Defensive code to handle empty or undefined name
                const capitalizedFirstName = name ? capitalizeFirstName(name) : "";

                const activeTransactions = (await sat.getPendingCalls(m.multisigId)).length;

                return {
                    id: m.multisigId,
                    image,
                    address,
                    capitalizedFirstName,
                    copyIcon,
                    activeTransactions,
                };
            }));

            setMultisigItems(processedList);

            // Set the activeButton to the address of the first item
            if (processedList.length > 0) {
                setActiveButton(processedList[0].id);
            }
        };

        runAsync();
    });

    /* createEffect(() => {
     *   const updatedItems = Array(10).fill(null).map((item, index) => {
     *     const name = `John Doe ${ index + 1 }`; // Example name for testing
     *     const address = randomAsHex(32); // Example address for testing
     *     const copyIcon = <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />;

     *     // Defensive code to handle empty or undefined name
     *     const capitalizedFirstName = name ? capitalizeFirstName(name) : "";

     *     return {
     *       address,
     *       capitalizedFirstName,
     *       copyIcon
     *     };
     *   });

     *   setMultisigItems(updatedItems);

     *   // Set the activeButton to the address of the first item
     *   if (updatedItems.length > 0) {
     *     setActiveButton(updatedItems[0].address);
     *   }
     * }); */

  onCleanup(() => {
    // Clean up the scrollContainerRef when the component is unmounted
    setScrollContainerRef(null);
  });

  return (
    <>
      <h5 class="text-sm mb-2 text-black dark:text-saturn-offwhite">Multisigs</h5>
      <div class="h-80 relative mb-6">
        <div
          ref={scrollContainerRef!}
          style={{
            'overflow-y': 'scroll',
            'scrollbar-width': 'thin',
            '-webkit-scrollbar-width': 'thin',
            '-moz-scrollbar-width': 'thin',
            '-ms-scrollbar-width': 'thin',
            '-o-scrollbar-width': 'thin',
            // 'scrollbar-color': '#692EFF #000000',
            // '-webkit-scrollbar-color': '#692EFF #ffffff',
            '-webkit-overflow-scrolling': 'touch',
          }}
          class={`h-full multisig-scrollbar pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}
        >
          {/* <div class="w-62 absolute bottom-0 inset-0 pointer-events-none">
            <div class="h-full bg-gradient-to-b from-transparent to-saturn-offwhite dark:to-saturn-black"></div>
          </div> */}

          {/* Active selected item */}
          {/* {selectedItem() !== null && (
            <div
              class="p-4 rounded-lg flex items-center grid grid-cols-5 dark:bg-saturn-darkpurple bg-purple-50 mb-2"
            >
              <div class={`col-span-1 rounded-full w-10 h-10 bg-saturn-purple`} />
              <div class="col-start-2 col-end-5 grid grid-rows-2 ml-3">
                <span class="text-sm text-saturn-yellow">{selectedItem()?.capitalizedFirstName}</span>
                <span class="text-xs flex items-center gap-x-2">
                  <span class="text-saturn-lightgrey">{stringShorten(selectedItem()?.address || 'n/a', 4)}</span>
                  <span class="text-saturn-lightgrey hover:opacity-50 hover:cursor-copy">{selectedItem()?.copyIcon}</span>
                  <span>
                    <A href="#" target="_blank" rel="noopener" class="text-saturn-lightgrey hover:text-saturn-yellow">
                      <span>𝕏</span>
                    </A>
                  </span>
                </span>
              </div>
            </div>
          )} */}

          {/* Multisig list */}
          <For each={multisigItems()} fallback={<div>Loading...</div>}>
            {(item: MultisigItem, index) => (
              <>
                <div
                  onClick={() => handleClick(index())}
                  class={`relative p-4 mr-4 rounded-lg flex flex-row  items-center hover:cursor-pointer ${ activeButton() === item.id ? 'border-2 border-saturn-purple bg-gray-50 dark:bg-saturn-darkgrey' : '' }`}
                >
                    <div class={`rounded-full w-10 h-10 bg-saturn-lightgrey ${ activeButton() === item.id ? 'bg-saturn-purple' : '' }`}>
                        <Show when={item.image}>
                            <img class="rounded-full" src={item.image} />
                        </Show>
                    </div>
                  <div class="grid grid-rows-2 ml-3">
                    <span class={`text-sm ${ activeButton() === item.id ? 'text-saturn-yellow' : 'text-saturn-darkgrey dark:text-saturn-white' }`}>{item.capitalizedFirstName}</span>
                    <span class="text-xs flex items-center gap-x-2">
                      <span class="text-saturn-lightgrey whitespace-nowrap">{stringShorten(item.address, 4)}</span>
                      <span class={`text-xs text-saturn-lightgrey hover:opacity-50 hover:cursor-copy ${ copiedIndex() === index() ? 'text-saturn-darkgrey' : '' }`} onClick={(e) => copyAddressToClipboard(e, item.address, index())}>
                        {copiedIndex() === index() ? <span class="text-[10px] text-">Copied!</span> : <span>{item.copyIcon}</span>}
                      </span>
                    </span>
                  </div>
                  {item.activeTransactions > 0 ? <div class="basis-1/4 leading-none text-[8px] text-white bg-saturn-purple rounded-full px-1.5 py-1 absolute right-4">{item.activeTransactions}</div> : null}
                </div>
              </>
            )}
          </For>
        </div>
      </div>
    </>
  );
};

MultisigList.displayName = 'MultisigList';
export default MultisigList;
