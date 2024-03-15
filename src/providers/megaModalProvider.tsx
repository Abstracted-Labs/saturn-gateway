import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount } from 'solid-js';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';
import { FEE_ASSET_MODAL_ID } from '../components/modals/FeeAssetModal';
import { PROPOSE_MODAL_ID } from '../components/modals/ProposeModal';

export type MegaModalContextType = {
  showMultisigListModal: () => void;
  hideMultisigListModal: () => void;
  showFeeAssetModal: () => void;
  hideFeeAssetModal: () => void;
  showProposeModal: () => void;
  hideProposeModal: () => void;
};

const MegaModalContext = createContext<MegaModalContextType>();

export function MegaModalProvider(props: { children: JSX.Element; }) {
  const [multisigListModalInstance, setMultisigListModalInstance] = createSignal<ModalInterface>();
  const [feeAssetModalInstance, setFeeAssetModalInstance] = createSignal<ModalInterface>();
  const [proposedModalInstance, setProposedModalInstance] = createSignal<ModalInterface>();
  const multisigListModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);
  const feeAssetModalElement = () => document.getElementById(FEE_ASSET_MODAL_ID);
  const proposedModalElement = () => document.getElementById(PROPOSE_MODAL_ID);

  onMount(() => {
    initModals();
  });

  onMount(() => {
    const modal = multisigListModalElement();
    if (multisigListModalElement()) {
      const instance = new Modal(modal);
      setMultisigListModalInstance(instance);
    }
  });

  onMount(() => {
    const modal = feeAssetModalElement();
    if (feeAssetModalElement()) {
      const instance = new Modal(modal);
      setFeeAssetModalInstance(instance);
    }
  });

  onMount(() => {
    const modal = proposedModalElement();
    if (proposedModalElement()) {
      const instance = new Modal(modal);
      setProposedModalInstance(instance);
    }
  });

  const showMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance && instance !== null && !instance.isVisible()) {
      instance.init();
      instance.show();
    }
  };

  const hideMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance && instance !== null && instance.isVisible()) {
      instance.hide();
      instance.destroy();
    }
  };

  const showFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance && instance !== null && !instance.isVisible()) {
      instance.init();
      instance.show();
    }
  };

  const hideFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance && instance !== null && instance.isVisible()) {
      instance.hide();
      instance.destroy();
    }
  };

  const showProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance && instance !== null && !instance.isVisible()) {
      instance.init();
      instance.show();
    }
  };

  const hideProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance && instance !== null && instance.isVisible()) {
      instance.hide();
      instance.destroy();
    }
  };

  const store = {
    showMultisigListModal,
    hideMultisigListModal,
    showFeeAssetModal,
    hideFeeAssetModal,
    showProposeModal,
    hideProposeModal,
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