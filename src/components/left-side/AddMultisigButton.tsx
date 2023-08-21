import { A } from '@solidjs/router';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';

const AddMultisigButton = () => {
  return <A href="/create"><button type="button" class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center">
    <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
    <span>Add Multisig</span>
  </button></A>;
};

AddMultisigButton.displayName = "AddMultisigButton";
export default AddMultisigButton;