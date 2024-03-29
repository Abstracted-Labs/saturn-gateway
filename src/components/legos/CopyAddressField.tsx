import { stringShorten } from "@polkadot/util";
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { createEffect, createMemo, createSignal, on } from "solid-js";
import { getEncodedAddress } from "../../utils/getEncodedAddress";
import { useMegaModal } from "../../providers/megaModalProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";

type CopyAddressFieldProps = { address: string | undefined; length: number; name?: string; isInModal?: boolean; };

const CopyAddressField = (props: CopyAddressFieldProps) => {
  const modal = useMegaModal();
  const saContext = useSelectedAccountContext();

  const [copiedNative, setCopiedNative] = createSignal<boolean>(false);
  const [copiedRelay, setCopiedRelay] = createSignal<boolean>(false);
  const hasName = createMemo(() => props.name !== undefined);
  const [encodedNativeAddress, setEncodedNativeAddress] = createSignal<string | undefined>(undefined);
  const [encodedRelayAddress, setEncodedRelayAddress] = createSignal<string | undefined>(undefined);

  const copyNativeToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    setCopiedNative(true);

    setTimeout(() => {
      setCopiedNative(false);
    }, 3000);
  };

  const copyRelayToClipboard = (e: MouseEvent, address: string | undefined) => {
    e.stopPropagation();
    e.stopImmediatePropagation();

    navigator.clipboard.writeText(address ?? '--');

    setCopiedRelay(true);

    setTimeout(() => {
      setCopiedRelay(false);
    }, 3000);
  };

  const openAddressSelectorModal = () => {
    modal.showAddressSelectorModal();
  };

  createEffect(() => {
    const address = props.address;
    if (!address) return;

    const nativeAddress = getEncodedAddress(address, 117);
    setEncodedNativeAddress(nativeAddress);

    const relayAddress = getEncodedAddress(address, 2);
    setEncodedRelayAddress(relayAddress);

    saContext.setters.setAddressToCopy(<ModalAddressSelector></ModalAddressSelector>);
  });

  const ModalAddressSelector = () => {
    return <div class="flex flex-col gap-2">
      <div>
        <span class="text-xs">Native Parachain (Tinkernet)</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey p-2 flex flex-row items-center justify-center text-xs hover:cursor-copy" onClick={(e) => copyNativeToClipboard(e, encodedNativeAddress())}>
          <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(encodedNativeAddress() ?? '--', 16)}</span>
          <span class={`ml-2 text-saturn-purple hover:opacity-50`}>
            {copiedNative() ? <span class="text-[8px]">Copied!</span> : <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
            </span>}
          </span>
        </div>
      </div>
      <div>
        <span class="text-xs">Relay Chain (Kusama)</span>
        <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey p-2 flex flex-row items-center justify-center text-xs hover:cursor-copy" onClick={(e) => copyRelayToClipboard(e, encodedRelayAddress())}>
          <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(encodedRelayAddress() ?? '--', 16)}</span>
          <span class={`ml-2 text-saturn-purple hover:opacity-50`}>
            {copiedRelay() ? <span class="text-[8px]">Copied!</span> : <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
            </span>}
          </span>
        </div>
      </div>
    </div>;
  };

  return <>
    <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey p-2 flex flex-row items-center justify-center text-xs">
      <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(encodedNativeAddress() ?? '--', props.isInModal ? 16 : 5)}</span>
      <span class={`ml-2 text-saturn-purple hover:opacity-50 hover:cursor-copy`} onClick={openAddressSelectorModal}>
        <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
        </span>
      </span>
    </div>
  </>;
};

CopyAddressField.displayName = 'CopyAddressField';
export default CopyAddressField;