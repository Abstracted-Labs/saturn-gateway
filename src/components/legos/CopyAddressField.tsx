import { hexToString, stringShorten, u8aToHex } from "@polkadot/util";
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { createEffect, createMemo, createSignal, on, onMount } from "solid-js";
import { getEncodedAddress } from "../../utils/getEncodedAddress";
import { useMegaModal } from "../../providers/megaModalProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { useToast } from "../../providers/toastProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

type CopyAddressFieldProps = {
  nativeAddress: string | undefined;
  multisigId?: number;
  length: number;
  name?: string;
  isInModal?: boolean;
  isUserAddress?: boolean;
};

const CopyAddressField = (props: CopyAddressFieldProps) => {
  const modal = useMegaModal();
  const saContext = useSelectedAccountContext();
  const toast = useToast();
  const sat = useSaturnContext();

  const hasName = createMemo(() => props.name !== undefined);
  const getNativeAddress = createMemo(() => props.nativeAddress);
  const getMultisigId = createMemo(() => props.multisigId);
  const isUserAddress = createMemo(() => props.isUserAddress);

  const copyNativeToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    toast.setToast("Copied native address to clipboard", "info", 0);

    modal.hideAddressSelectorModal();
  };

  const copyRelayToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    toast.setToast("Copied relay address to clipboard", "info", 0);

    modal.hideAddressSelectorModal();
  };

  const openAddressSelectorModal = async (e: MouseEvent) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    const addressNative = getNativeAddress();
    const saturn = sat.state.saturn;
    const multisigId = getMultisigId();

    if (!addressNative || !saturn || !multisigId) {
      console.error('No native address, saturn context, or multisigId found');
      return;
    };

    console.log({ multisigId });
    const details = await saturn.getDetails(multisigId as number);

    if (!details) {
      console.error('No details found for multisigId', multisigId);
      return;
    };

    const relayAddress = encodeAddress(details.relayAccount, 2).toString();
    const evmAddress = u8aToHex(details.evmAccount);

    if (!relayAddress || !evmAddress) {
      console.error('No relay or evm address found');
      return;
    };

    saContext.setters.setAddressToCopy(<ModalAddressSelector relay={relayAddress} native={addressNative} evm={evmAddress} /> as Element);

    modal.showAddressSelectorModal();
  };

  function ModalAddressSelector(selected: { relay: string, native: string; evm: string; }) {
    return <div class="flex flex-col gap-2">
      <div>
        <span class="text-xxs">Parachain Address</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs hover:cursor-copy border border-gray-800" onClick={(e) => copyNativeToClipboard(e, selected.native)}>
          <span class="mx-2">{selected.native && stringShorten(selected.native ?? '--', selected.native?.length)}</span>
        </div>
      </div>
      <div>
        <span class="text-xxs">Relay Chain Address</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs hover:cursor-copy border border-gray-800" onClick={(e) => copyRelayToClipboard(e, selected.relay)}>
          <span class="mx-2">{selected.relay && stringShorten(selected.relay ?? '--', selected.relay?.length)}</span>
        </div>
      </div>
      <div>
        <span class="text-xxs">EVM Address</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs hover:cursor-copy border border-gray-800" onClick={(e) => copyNativeToClipboard(e, selected.evm)}>
          <span class="mx-2">{selected.evm && stringShorten(selected.evm ?? '--', selected.evm?.length)}</span>
        </div>
      </div>
    </div>;
  };


  return <>
    <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xs border border-gray-800 hover:opacity-50 hover:cursor-copy" onClick={(e) => !isUserAddress() ? openAddressSelectorModal(e) : copyNativeToClipboard(e, getNativeAddress() ? getEncodedAddress(getNativeAddress() as string, 117) : 'N/A')}>
      <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(getEncodedAddress(getNativeAddress() as string, 117) ?? '--', props.isInModal ? 16 : 5)}</span>
      <span class={`ml-2 text-saturn-purple`}>
        <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
        </span>
      </span>
    </div>
  </>;
};

CopyAddressField.displayName = 'CopyAddressField';
export default CopyAddressField;