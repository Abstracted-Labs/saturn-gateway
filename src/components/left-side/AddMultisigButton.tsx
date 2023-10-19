import { A } from '@solidjs/router';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import { createEffect, createMemo, createSignal } from 'solid-js';

const AddMultisigButton = () => {
  const [mutateButton, setMutateButton] = createSignal(false);

  createEffect(() => {
    const isDrawerPresent = () => !!document.getElementById('inDrawer');
    if (isDrawerPresent()) {
      setMutateButton(true);
    } else {
      setMutateButton(false);
    }
  });

  return <A href="/create"><button id="addMultisigButton" type="button" data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined} aria-controls={mutateButton() ? 'leftSidebar' : undefined} class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center focus:outline-purple-500">
    <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
    <span>Add Multisig</span>
  </button></A>;
};

AddMultisigButton.displayName = "AddMultisigButton";
export default AddMultisigButton;