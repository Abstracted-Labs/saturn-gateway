import { A, useLocation } from '@solidjs/router';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { useSaturnContext } from '../../providers/saturnProvider';

const AddMultisigButton = () => {
  const [mutateButton, setMutateButton] = createSignal(false);

  const saContext = useSaturnContext();
  const location = useLocation();

  const multisigId = createMemo(() => saContext.state.multisigId);
  const onCreatePage = createMemo(() => location.pathname.endsWith('create'));

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
      if (onCreatePage()) {
        return props.children;
      } else {
        return <A href="/create" replace>
          {props.children}
        </A>;
      }
    } else {
      return null;
    }
  };

  return <AddButton>
    <button id="addMultisigButton" type="button" data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined} aria-controls={mutateButton() ? 'leftSidebar' : undefined} class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center focus:outline-purple-500 disabled:opacity-25" disabled={onCreatePage() && !multisigId()}>
      <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
      <span>Add Multisig</span>
    </button>
  </AddButton>;
};

AddMultisigButton.displayName = "AddMultisigButton";
export default AddMultisigButton;