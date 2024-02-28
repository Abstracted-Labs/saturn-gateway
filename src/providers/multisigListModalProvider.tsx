import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';

type MegaModalContextType = {
  showMultisigListModal: () => void;
  hideMultisigListModal: () => void;
};

const MegaModalContext = createContext<MegaModalContextType>();

export function MegaModalProvider(props: { children: JSX.Element; }) {
  const [multisigListModalInstance, setMultisigListModalInstance] = createSignal<ModalInterface>();
  const multisigListModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);

  onMount(() => {
    initModals();
  });

  createEffect(() => {
    if (multisigListModalElement()) {
      const instance = new Modal(multisigListModalElement());
      setMultisigListModalInstance(instance);
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

  const store = {
    showMultisigListModal,
    hideMultisigListModal,
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