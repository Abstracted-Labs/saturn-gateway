import { randomAsHex } from '@polkadot/util-crypto';
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { hexToString, stringShorten } from '@polkadot/util';
import { createSignal, createEffect, For, onCleanup, Show, JSXElement, createMemo, lazy, on, Switch, Match, onMount } from 'solid-js';
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";
import { A, useLocation, useNavigate, useParams } from '@solidjs/router';
import { useThemeContext } from '../../providers/themeProvider';
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { Rings } from "../../data/rings";
import { useRingApisContext } from "../../providers/ringApisProvider";
import PageLinks from './PageLinks';
import { FALLBACK_TEXT_STYLE, MultisigItem } from '../../utils/consts';
import LoaderAnimation from '../legos/LoaderAnimation';
import { useMegaModal } from '../../providers/megaModalProvider';
import { getMultisigsForAccount } from '../../utils/getMultisigs';
import { usePriceContext } from '../../providers/priceProvider';
import { useIdentityContext } from '../../providers/identityProvider';
import { useBalanceContext } from '../../providers/balanceProvider';
import { MultisigDetails } from '@invarch/saturn-sdk';
import { useToast } from '../../providers/toastProvider';
import EyeOpenIcon from '../../assets/icons/eye-open.svg';
import EyeClosedIcon from '../../assets/icons/eye-closed.svg';

export const MULTISIG_LIST_MODAL_ID = 'multisigListModal';

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

interface MultisigListProps {
  isInModal?: boolean;
}

const MultisigList = (props: MultisigListProps) => {
  let scrollContainerRef: HTMLDivElement | null = null;
  const theme = useThemeContext();
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const [activeButton, setActiveButton] = createSignal<number | null>(null);
  const [multisigItems, setMultisigItems] = createSignal<MultisigItem[]>([]);
  const [originalOrder, setOriginalOrder] = createSignal<MultisigItem[]>([]);
  const [mutateButton, setMutateButton] = createSignal(false);
  const [loading, setLoading] = createSignal<boolean>(true);

  const modal = useMegaModal();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const ringApisContext = useRingApisContext();
  const navigate = useNavigate();
  const loc = useLocation();
  const prices = usePriceContext();
  const identity = useIdentityContext();
  const balances = useBalanceContext();
  const toast = useToast();

  const multisigItemsLength = createMemo(() => multisigItems().length);
  const getAccountAddress = createMemo(() => selectedAccountContext.state.account?.address);
  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const isInModal = createMemo(() => props.isInModal);
  const saturn = createMemo(() => saturnContext.state.saturn);
  const tinkernetApi = createMemo(() => ringApisContext.state.tinkernet);

  const handleClick = async (orderIndex: number) => {
    const sat = saturnContext.state.saturn;

    if (!sat) {
      console.error('Saturn context not found');
      return;
    };

    const multisig = multisigItems()[orderIndex];
    const id = multisig.id;

    console.log('multisig details', multisig);

    if (isInModal()) {
      modal.hideMultisigListModal();
    }

    if (id === undefined || (!isInModal() && id === activeButton())) {
      return;
    };

    balances?.clearBalances();

    setActiveButton(id);

    saturnContext.setters.setMultisigId(id);

    try {
      toast.setToast('Switching omnisigs...', 'loading');
      const maybeDetails = await sat.getDetails(id);
      if (maybeDetails) {
        console.log('Multisig details:', maybeDetails.parachainAccount.toHuman());
        saturnContext.setters.setMultisigDetails(maybeDetails);
        saturnContext.setters.setMultisigAddress(maybeDetails.parachainAccount.toHuman());
      } else {
        console.error('No multisig details found');
      }
    } catch (error) {
      console.error(error);
      toast.setToast('An error occurred', 'error');
    } finally {
      navigate(`/${ id }/assets`, { replace: true });

      // Remove the selected item from the list and update the selected item
      const selectedItem = originalOrder()[orderIndex];
      setMultisigItems(originalOrder());

      // Clear identity cache
      identity.actions.clearIdentities();

      // Close the left drawer
      closeLeftDrawer();

      // Notify the user
      toast.setToast(`Now using ${ selectedItem.capitalizedFirstName } omnisig`, 'info', 1000);
    }

    // Reset the scroll position
    const scrollContainer = scrollContainerRef;
    if (scrollContainer instanceof HTMLDivElement) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const closeLeftDrawer = () => {
    const button = document.querySelector('button[data-drawer-hide="leftSidebar"][aria-controls="leftSidebar"]');
    if (button instanceof HTMLButtonElement) {
      button.click();
    }
  };

  const setScrollContainerRef = (ref: HTMLDivElement | null) => {
    scrollContainerRef = ref;
  };

  createEffect(on(getMultisigId, () => {
    setLoading(true);
  }));

  createEffect(() => {
    // Make a copy of the original order of the multisig items
    setOriginalOrder([...multisigItems()]);
  });

  createEffect(() => {
    // Load the multisig list
    let timeout: any;
    const sat = saturn();
    const address = getAccountAddress();
    const api = tinkernetApi();

    const delayUnload = () => {
      timeout = setTimeout(() => {
        setLoading(false);
      }, 200);
    };

    if (!sat || !address || !api) {
      delayUnload();
      return;
    };

    const load = async () => {
      let iden;
      const path = loc.pathname;
      const urlId = path.split('/')[1];

      const multisigs = await getMultisigsForAccount(address, api);

      const sortedByDescendingId = multisigs.sort((a, b) => b - a);

      if (sortedByDescendingId.length === 0) {
        saturnContext.setters.setMultisigItems([]);
        setMultisigItems([]);
        setLoading(false);
        toast.setToast('No omnisigs found for this account', 'info');
        return;
      }

      const processedList: MultisigItem[] = await Promise.all(sortedByDescendingId.map(async (m) => {
        const multisigDetails: MultisigDetails | null = await sat.getDetails(m);

        const address = multisigDetails?.parachainAccount.toHuman() as string;

        iden = await api.query.identity.identityOf(address).then((i) => (i?.toHuman() as {
          info: {
            display: { Raw: string; };
            image: { Raw: string; };
          };
        })?.info);

        let name = `Omnisig ${ m }`;
        if (!!iden && iden?.display?.Raw) {
          name = iden.display.Raw;
        } else {
          try {
            const metadata = multisigDetails && multisigDetails.metadata ? JSON.parse(hexToString(multisigDetails.metadata)) : null;
            if (metadata) {
              const parsedData = JSON.parse(metadata);
              name = parsedData.name;
            }
          } catch (error) {
            console.warn("Error parsing name from multisigDetails.metadata.name:", error);
          }
        }

        const image = iden?.image?.Raw;

        const copyIcon = <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />;

        const capitalizedFirstName = name ? capitalizeFirstName(name) : "";

        const activeTransactions = (await sat.getPendingCalls(m)).length;

        return {
          id: m,
          image,
          address,
          capitalizedFirstName,
          copyIcon,
          activeTransactions,
        };
      }));

      if (processedList.length > 0) {
        // Check if a multisigId matches the id from the url
        const selectedItem = processedList.find(item => item.id === parseInt(urlId));
        const selectedId = selectedItem ? selectedItem.id : processedList[0].id;

        // Set the activeButton to the selectedId
        setActiveButton(selectedId);

        // Move the selected item to the top of the list
        if (selectedItem) {
          const updatedItems: MultisigItem[] = [selectedItem, ...processedList.filter(item => item.id !== selectedId)];
          setMultisigItems(updatedItems);
        } else {
          setMultisigItems(processedList);
        }

        // Set the multisigItems state in Saturn context
        saturnContext.setters.setMultisigItems(processedList);

        // Only set the multisig details in Saturn context if urlId matches selectedId
        if (selectedItem) {
          saturnContext.setters.setMultisigId(selectedId);

          const maybeDetails = await sat.getDetails(selectedId);
          if (maybeDetails) {
            saturnContext.setters.setMultisigDetails(maybeDetails);
            saturnContext.setters.setMultisigAddress(maybeDetails.parachainAccount.toHuman());
          }
        }
      } else {
        // If there are no current multisigs, reset previous state 
        setMultisigItems([]);

        // Reset multisigItems state in Saturn context
        saturnContext.setters.setMultisigItems([]);
      }

      setLoading(false);
    };

    load();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  createEffect(() => {
    const isDrawerPresent = () => !!document.getElementById('inDrawer');
    if (isDrawerPresent()) {
      setMutateButton(true);
    } else {
      setMutateButton(false);
    }
  });

  onCleanup(() => {
    // Clean up the scrollContainerRef when the component is unmounted
    setScrollContainerRef(null);
  });

  return (
    <div>
      <h5 class="text-sm mb-2 text-black dark:text-saturn-offwhite">{!isInModal() ? 'Omnisig Accounts' : 'Select an Omnisig Account below:'}</h5>
      <div class={`relative mb-2`}>
        <div
          ref={scrollContainerRef!}
          class={`${ multisigItemsLength() < 2 ? 'h-32' : 'h-64' } pr-5 overflow-y-scroll overflow-x-hidden saturn-scrollbar pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}
        >
          {/* Multisig list */}
          <Switch fallback={<div>
            {loading() ? <LoaderAnimation text="Loading omnisig accounts..." /> : multisigItems().length === 0 && <div class={FALLBACK_TEXT_STYLE}>No omnisigs yet.</div>}
          </div>}>
            <Match when={multisigItems() && multisigItems().length > 0}>
              <For each={multisigItems()} fallback={<div class={FALLBACK_TEXT_STYLE}>You don't have any omnisigs yet.</div>}>
                {(item: MultisigItem, index) => (
                  <div
                    onClick={() => handleClick(index())}
                    class={`relative px-3 pb-3 pt-1 rounded-lg w-full flex flex-row items-center justify-between hover:cursor-pointer border-[1.5px] ${ activeButton() === item.id ? 'border-saturn-purple bg-gray-100 dark:bg-saturn-darkgrey' : 'border-gray-800 bg-saturn-darkgrey bg-opacity-60' } mb-2`}
                    data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined}
                    aria-controls={mutateButton() ? 'leftSidebar' : undefined}
                  >
                    <div class={`flex items-center justify-center relative top-1 rounded-full w-10 h-10 bg-saturn-lightgrey ${ activeButton() === item.id ? 'bg-saturn-purple' : '' }`}>
                      <Show when={item.image}>
                        <img class="rounded-full w-5 h-auto" src={item.image} />
                      </Show>
                      <Show when={!item.image}>
                        <img class="rounded-full w-5 h-auto" src={item.id === activeButton() ? EyeOpenIcon : EyeClosedIcon} />
                      </Show>
                    </div>
                    <div class="grid grid-rows-2 ml-3 grow">
                      <div class="flex flex-row shrink items-center ellipsis truncate gap-x-2">
                        <span class={`text-xs ellipsis truncate ${ activeButton() === item.id ? 'text-saturn-yellow' : 'text-saturn-darkgrey dark:text-saturn-white' }`}>
                          {item.capitalizedFirstName}
                        </span>
                        <span>
                          {item.activeTransactions > 0 ? <div class="leading-none text-[8px] text-white bg-saturn-purple rounded-full px-1.5 py-1">{item.activeTransactions}</div> : null}
                        </span>
                      </div>
                      <Show when={item.address}>
                        <CopyAddress address={item.address} length={4} isInModal={isInModal()} />
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

MultisigList.displayName = 'MultisigList';
export default MultisigList;
