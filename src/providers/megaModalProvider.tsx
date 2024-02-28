import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount } from 'solid-js';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';
import { FEE_ASSET_MODAL_ID } from '../components/modals/FeeAssetModal';

type MegaModalContextType = {
  showMultisigListModal: () => void;
  hideMultisigListModal: () => void;
  showFeeAssetModal: () => void;
  hideFeeAssetModal: () => void;
};

const MegaModalContext = createContext<MegaModalContextType>();

export function MegaModalProvider(props: { children: JSX.Element; }) {
  const [multisigListModalInstance, setMultisigListModalInstance] = createSignal<ModalInterface>();
  const [feeAssetModalInstance, setFeeAssetModalInstance] = createSignal<ModalInterface>();
  const multisigListModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);
  const feeAssetModalElement = () => document.getElementById(FEE_ASSET_MODAL_ID);

  onMount(() => {
    initModals();
  });

  createEffect(() => {
    if (multisigListModalElement()) {
      const instance = new Modal(multisigListModalElement());
      setMultisigListModalInstance(instance);
    }

    if (feeAssetModalElement()) {
      const instance = new Modal(feeAssetModalElement());
      setFeeAssetModalInstance(instance);
    }
  });

  const showMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance && instance !== null) {
      instance.show();
    }
  };

  const hideMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance && instance !== null) {
      instance.hide();
    }
  };

  const showFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance && instance !== null) {
      instance.show();
    }
  };

  const hideFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance && instance !== null) {
      instance.hide();
    }
  };

  const store = {
    showMultisigListModal,
    hideMultisigListModal,
    showFeeAssetModal,
    hideFeeAssetModal,
  };

  return (
    <MegaModalContext.Provider value={store}>
      {props.children}
    </MegaModalContext.Provider>
  );
}

export function useMegaModal() {
  const context = useContext(MegaModalContext);

  if (!context) {
    throw new Error("useMultisigListModal: cannot find a MultisigListModalContext");
  }

  return context;
}