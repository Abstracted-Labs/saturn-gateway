import { randomAsHex } from '@polkadot/util-crypto';
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { stringShorten } from '@polkadot/util';
import { createSignal, createEffect, For, onCleanup, Show, JSXElement, createMemo, lazy, on } from 'solid-js';
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";
import { A, useLocation, useNavigate, useParams } from '@solidjs/router';
import { useThemeContext } from '../../providers/themeProvider';
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { Rings } from "../../data/rings";
import { useRingApisContext } from "../../providers/ringApisProvider";
import PageLinks from './PageLinks';
import { FALLBACK_TEXT_STYLE, MultisigItem } from '../../utils/consts';

const CopyAddress = lazy(() => import('../legos/CopyAddressField'));

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
  const [multisigItems, setMultisigItems] = createSignal<MultisigItem[]>([]);
  const [originalOrder, setOriginalOrder] = createSignal([...multisigItems()]);
  const [copiedIndex, setCopiedIndex] = createSignal<number | null>(null);
  const [mutateButton, setMutateButton] = createSignal(false);
  // const [selectedItem, setSelectedItem] = createSignal<MultisigItem | null>
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const ringApisContext = useRingApisContext();
  const navigate = useNavigate();
  const location = useLocation();

  const multisigItemsLength = createMemo(() => multisigItems().length);

  const selectedState = createMemo(() => selectedAccountContext.state);

  const currentPage = createMemo(() => location.pathname);

  function handleClick(index: number) {
    const sat = saturnContext.state.saturn;
    if (!sat) return;

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

      saturnContext.setters.setMultisigId(id);

      sat.getDetails(id).then((maybeDetails) => {
        if (maybeDetails) {
          saturnContext.setters.setMultisigDetails(maybeDetails);
          saturnContext.setters.setMultisigAddress(maybeDetails.account.toHuman());
        }
      });

      navigate(`/${ id }/members`);

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
    }, 3000);
  }

  createEffect(() => {
    setOriginalOrder([...multisigItems()]);
  });

  createEffect(() => {
    let timeout: any;
    const sat = saturnContext.state.saturn;
    const acc = selectedState().account?.address;
    const api = ringApisContext.state.tinkernet;

    async function load() {
      if (!sat || !acc || !api) return;
      let iden;
      const multisigs = await sat.getMultisigsForAccount(acc);
      const sortedByDescendingId = multisigs.sort((a, b) => b.multisigId - a.multisigId);

      const processedList: MultisigItem[] = await Promise.all(sortedByDescendingId.map(async (m) => {
        // We calculate the address locally instead of wasting time fetching from the chain.
        // The v2 of the Saturn SDK should have a function to calculate the address.
        const address = encodeAddress(
          blake2AsU8a(
            api.createType("(H256, u32)", [Rings.tinkernet.genesisHash, m.multisigId]).toU8a(), 256
          ), 117);
        iden = await api.query.identity.identityOf(address).then((i) => (i?.toHuman() as {
          info: {
            display: { Raw: string; };
            image: { Raw: string; };
          };
        })?.info);

        const name = iden?.display?.Raw || `Multisig ${ m.multisigId }`;

        const image = iden?.image?.Raw;

        const copyIcon = <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />;

        // Defensive code to handle empty or undefined name
        const capitalizedFirstName = name ? capitalizeFirstName(name) : "";

        const activeTransactions = (await sat.getPendingCalls(m.multisigId)).length;
        console.log('activeTransactions', activeTransactions, m);
        return {
          id: m.multisigId,
          image,
          address,
          capitalizedFirstName,
          copyIcon,
          activeTransactions,
        };
      }));

      console.log('processedList', processedList);

      setMultisigItems(processedList);
      saturnContext.setters.setMultisigItems(processedList);

      // Set the activeButton to the address of the first item
      if (processedList.length > 0) {
        setActiveButton(processedList[0].id);
      }
    }

    timeout = setTimeout(() => {
      load();
    }, 200);

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  createEffect(() => {
    if (location.pathname.endsWith('/create')) return;
  });

  createEffect(() => {
    const isDrawerPresent = () => !!document.getElementById('inDrawer');
    if (isDrawerPresent()) {
      setMutateButton(true);
    } else {
      setMutateButton(false);
    }
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
      <div class={`${ multisigItemsLength() === 0 ? 'h-6' : multisigItemsLength() > 0 && multisigItemsLength() < 4 ? 'h-40' : 'h-80' } relative mb-6`}>
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
          class={`h-full saturn-scrollbar pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}
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
          <For each={multisigItems()} fallback={<div class={FALLBACK_TEXT_STYLE}>{multisigItemsLength() === 0 ? `You don't have any multisigs yet.` : 'Loading...'}</div>}>
            {(item: MultisigItem, index) => (
              <>
                <div
                  onClick={() => handleClick(index())}
                  class={`relative p-4 mr-4 rounded-lg flex flex-row items-center hover:cursor-pointer ${ activeButton() === item.id ? 'border-[1.5px] border-saturn-purple bg-gray-100 dark:bg-saturn-darkgrey' : '' }`}
                  data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined}
                  aria-controls={mutateButton() ? 'leftSidebar' : undefined}
                >
                  <div class={`rounded-full w-10 h-10 bg-saturn-lightgrey ${ activeButton() === item.id ? 'bg-saturn-purple' : '' }`}>
                    <Show when={item.image}>
                      <img class="rounded-full" src={item.image} />
                    </Show>
                  </div>
                  <div class="grid grid-rows-2 ml-3">
                    <span class={`text-sm ${ activeButton() === item.id ? 'text-saturn-yellow' : 'text-saturn-darkgrey dark:text-saturn-white' }`}>{item.capitalizedFirstName}</span>
                    <Show when={item.address}>
                      <CopyAddress address={item.address} length={4} />
                    </Show>
                  </div>
                  {item.activeTransactions > 0 ? <div class="basis-1/4 leading-none text-[8px] text-white bg-saturn-purple rounded-full px-1.5 py-1 absolute right-4">{item.activeTransactions}</div> : null}
                </div>
              </>
            )}
          </For>
        </div>
      </div>

      {/* Page nav links should not show when logged out or when multisigItems.length === 0 */}
      {/* <Show when={multisigItemsLength() > 0}> */}
      <PageLinks />
      {/* </Show> */}
    </>
  );
};

MultisigList.displayName = 'MultisigList';
export default MultisigList;
