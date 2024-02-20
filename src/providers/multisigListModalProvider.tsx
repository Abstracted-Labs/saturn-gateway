import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';

type MultisigListModalContextType = {
  isVisible: boolean;
  showModal: () => void;
  hideModal: () => void;
};

const MultisigListModalContext = createContext<MultisigListModalContextType>();

export function MultisigListModalProvider(props: { children: JSX.Element; }) {
  const [state, setState] = createStore({ isVisible: false });
  const [modalInstance, setModalInstance] = createSignal<ModalInterface>();
  const modalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);

  onMount(() => {
    initModals();
  });

  createEffect(() => {
    if (modalElement()) {
      const instance = new Modal(modalElement());
      setModalInstance(instance);
    }
  });

  const showModal = () => {
    const instance = modalInstance();
    if (instance && instance !== null) {
      instance.show();
    }
    setState('isVisible', true);
  };

  const hideModal = () => {
    const instance = modalInstance();
    if (instance && instance !== null) {
      instance.hide();
    }
    setState('isVisible', false);
  };

  const store = {
    isVisible: state.isVisible,
    showModal,
    hideModal,
  };

  return (
    <MultisigListModalContext.Provider value={store}>
      {props.children}
    </MultisigListModalContext.Provider>
  );
}

export function useMultisigListModal() {
  const context = useContext(MultisigListModalContext);

  if (!context) {
    throw new Error("useMultisigListModal: cannot find a MultisigListModalContext");
  }

  return context;
}