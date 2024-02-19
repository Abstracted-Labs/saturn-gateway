import { ModalInterface, initModals, Modal } from "flowbite";
import { onMount } from "solid-js";
import MultisigList, { MULTISIG_LIST_MODAL_ID } from "../left-side/MultisigList";

const MultisigListModal = () => {
  let modal: ModalInterface;
  const $modalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);

  const removeModal = () => {
    if (modal) {
      modal.hide();
    }
  };

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });

  return (
    <>
      <div id={MULTISIG_LIST_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
        <div id="multisigModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1 w-full" />
        <div class={`relative h-auto px-4 bg-saturn-offwhite dark:bg-black border border-gray-900  rounded-md w-full max-w-[1200px]`}>
          <div class="flex flex-row items-start justify-between gap-10 p-4">
            <h4 class="text-md font-semibold text-gray-900 dark:text-white">
              Welcome back, traveler!
            </h4>
            <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={removeModal}>
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <div class="flex flex-col px-5 lg:px-2 xs:pt-1 lg:pt-0 z-[60] mt-8 w-full max-w-[1200px]">
            <MultisigList isInModal={true} />
          </div>
        </div>
      </div>
    </>
  );
};

MultisigListModal.displayName = 'MultisigListModal';
export default MultisigListModal;
