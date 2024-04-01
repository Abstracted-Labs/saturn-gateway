import { stringShorten } from "@polkadot/util";
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { createEffect, createMemo, createSignal, on, onMount } from "solid-js";
import { getEncodedAddress } from "../../utils/getEncodedAddress";
import { useMegaModal } from "../../providers/megaModalProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { useToast } from "../../providers/toastProvider";

type CopyAddressFieldProps = { address: string | undefined; length: number; name?: string; isInModal?: boolean; };

const CopyAddressField = (props: CopyAddressFieldProps) => {
  const modal = useMegaModal();
  const saContext = useSelectedAccountContext();
  const toast = useToast();

  const [copiedNative, setCopiedNative] = createSignal<boolean>(false);
  const [copiedRelay, setCopiedRelay] = createSignal<boolean>(false);
  const [encodedNativeAddress, setEncodedNativeAddress] = createSignal<string | undefined>(undefined);
  const [encodedRelayAddress, setEncodedRelayAddress] = createSignal<string | undefined>(undefined);

  const hasName = createMemo(() => props.name !== undefined);
  const getAddress = createMemo(() => props.address);

  const copyNativeToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    setCopiedNative(true);

    setTimeout(() => {
      setCopiedNative(false);
    }, 3000);

    toast.setToast("Copied native address to clipboard", "info", 0);

    modal.hideAddressSelectorModal();
  };

  const copyRelayToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    setCopiedRelay(true);

    setTimeout(() => {
      setCopiedRelay(false);
    }, 3000);

    toast.setToast("Copied relay address to clipboard", "info", 0);

    modal.hideAddressSelectorModal();
  };

  const openAddressSelectorModal = (e: MouseEvent) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    const address = getAddress();

    if (!address) return;

    const nativeAddress = getEncodedAddress(address, 117);
    setEncodedNativeAddress(nativeAddress);

    const relayAddress = getEncodedAddress(address, 2);
    setEncodedRelayAddress(relayAddress);

    saContext.setters.setAddressToCopy(<ModalAddressSelector relay={relayAddress} native={nativeAddress} /> as Element);

    modal.showAddressSelectorModal();
  };

  onMount(() => {
    const address = getAddress();

    if (!address) return;

    const nativeAddress = getEncodedAddress(address, 117);
    setEncodedNativeAddress(nativeAddress);

    const relayAddress = getEncodedAddress(address, 2);
    setEncodedRelayAddress(relayAddress);
  });

  function ModalAddressSelector(selected: { relay: string, native: string; }) {
    return <div class="flex flex-col gap-2">
      <div>
        <span class="text-xxs">Native Parachain (Tinkernet)</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs hover:cursor-copy border border-gray-800" onClick={(e) => copyNativeToClipboard(e, selected.native)}>
          <span class="mx-2">{selected.native && stringShorten(selected.native ?? '--', selected.native?.length)}</span>
          {/* <span class={`ml-2 text-saturn-purple hover:opacity-50`}>
            <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
          </span> */}
        </div>
      </div>
      <div>
        <span class="text-xxs">Relay Chain (Kusama)</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs hover:cursor-copy border border-gray-800" onClick={(e) => copyRelayToClipboard(e, selected.relay)}>
          <span class="mx-2">{selected.relay && stringShorten(selected.relay ?? '--', selected.relay?.length)}</span>
          {/* <span class={`ml-2 text-saturn-purple hover:opacity-50`}>
            <img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
          </span> */}
        </div>
      </div>
    </div>;
  };


  return <>
    <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs border border-gray-800 hover:opacity-50 hover:cursor-copy" onClick={(e) => openAddressSelectorModal(e)}>
      <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(encodedNativeAddress() ?? '--', props.isInModal ? 16 : 5)}</span>
      <span class={`ml-2 text-saturn-purple`}>
        <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
        </span>
      </span>
    </div>
  </>;
};

CopyAddressField.displayName = 'CopyAddressField';
export default CopyAddressField;