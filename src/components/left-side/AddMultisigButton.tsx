import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { useSelectedAccountContext } from '../../providers/selectedAccountProvider';
import { useMegaModal } from '../../providers/megaModalProvider';
import { BUTTON_LARGE_STYLE, CREATE_NEW_ACC_BUTTON_STYLE } from '../../utils/consts';

export const MULTISIG_MODAL_ID = 'multisigModal';
export const ADD_MEMBER_MODAL_ID = 'addMemberModal';

interface AddMultisigButtonProps {
  isInModal?: boolean;
}

const AddMultisigButton = (props: AddMultisigButtonProps) => {
  const modal = useMegaModal();
  const [mutateButton, setMutateButton] = createSignal(false);

  const saContext = useSelectedAccountContext();

  const isLoggedIn = createMemo(() => !!saContext.state.account?.address);
  const isInModal = createMemo(() => props.isInModal);

  const openModal = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInModal()) {
      modal.hideMultisigListModal();
      return;
    }

    modal.showCreateMultisigModal();
  };

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
    <button id="addMultisigButton" type="button" onClick={(e) => openModal(e)} data-modal-target={MULTISIG_MODAL_ID} data-modal-show={MULTISIG_MODAL_ID} data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined} aria-controls={mutateButton() ? 'leftSidebar' : undefined} class={CREATE_NEW_ACC_BUTTON_STYLE} disabled={!isLoggedIn()}>
      <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
      <span>Create New Account</span>
    </button>
  </AddButton>;
};

AddMultisigButton.displayName = "AddMultisigButton";
export default AddMultisigButton;