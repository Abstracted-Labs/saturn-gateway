import { A, useLocation } from '@solidjs/router';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import { useSaturnContext } from '../../providers/saturnProvider';
import { ModalInterface, initModals, Modal, ModalOptions } from 'flowbite';
import { useSelectedAccountContext } from '../../providers/selectedAccountProvider';

export const MULTISIG_MODAL_ID = 'multisigModal';

const AddMultisigButton = () => {
  const [modal, setModal] = createSignal<ModalInterface | null>(null);
  const [mutateButton, setMutateButton] = createSignal(false);

  const saContext = useSelectedAccountContext();

  const isLoggedIn = createMemo(() => !!saContext.state.account?.address);

  function openModal() {
    if (modal() && modal()?.show) {
      const $modalElement = () => document.getElementById(MULTISIG_MODAL_ID);
      if ($modalElement()) {
        modal()?.show();
      }
    }
  }

  onMount(() => {
    const $modalElement = () => document.getElementById(MULTISIG_MODAL_ID);
    const modalOptions: ModalOptions = {
      backdrop: 'dynamic',
      closable: true,
    };

    initModals();
    if (!$modalElement()) {
      setModal(new Modal($modalElement(), modalOptions));
    }
  });

  createEffect(() => {
    const isDrawerPresent = () => !!document.getElementById('inDrawer');
    if (isDrawerPresent()) {
      setMutateButton(true);
    } else {
      setMutateButton(false);
    }
  });

  const AddButton = (props: { children: any; }) => {
    if (!!props.children) {
      return props.children;
    } else {
      return null;
    }
  };

  return <AddButton>
    <button id="addMultisigButton" type="button" onClick={openModal} data-modal-target={MULTISIG_MODAL_ID} data-modal-show={MULTISIG_MODAL_ID} data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined} aria-controls={mutateButton() ? 'leftSidebar' : undefined} class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center focus:outline-purple-500 disabled:opacity-25 disabled:cursor-not-allowed" disabled={!isLoggedIn()}>
      <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
      <span>Create New Multisig</span>
    </button>
  </AddButton>;
};

AddMultisigButton.displayName = "AddMultisigButton";
export default AddMultisigButton;