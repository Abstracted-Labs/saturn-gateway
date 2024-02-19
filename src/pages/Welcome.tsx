import { createEffect, createSignal, Switch, Match, onMount, on } from "solid-js";
import ConnectWallet from "../components/top-nav/ConnectWallet";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import AddMultisigButton from "../components/left-side/AddMultisigButton";
import { ModalInterface, initModals, Modal } from "flowbite";
import { MULTISIG_LIST_MODAL_ID } from "../components/left-side/MultisigList";

const Welcome = () => {
  let modal: ModalInterface;
  const $modalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);

  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [hasMultisigs, setHasMultisigs] = createSignal(false);
  const [isMultisigId, setIsMultisigId] = createSignal(false);

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);
  });

  createEffect(() => {
    setIsLoggedIn(!!selectedAccountContext.state.account?.address);
  });

  createEffect(() => {
    setHasMultisigs(!!(saturnContext.state.multisigItems && saturnContext.state.multisigItems.length > 0));
  });

  createEffect(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    setIsMultisigId(idOrAddress !== 'undefined');
  });

  createEffect(on(hasMultisigs, () => {
    if (modal && modal?.show) {
      modal.show();
    }
  }));

  return (
    <Switch>
      {/* <Match when={hasMultisigs()}>
        <div class="text-xs mx-auto text-center">
          <h2 class="text-lg font-bold">Welcome back.</h2>
          <p class="mt-1">Select a multisig to get started.</p>
        </div>
      </Match> */}
      <Match when={isLoggedIn() && !hasMultisigs() && !isMultisigId()}>
        <div class="text-xs mx-auto text-center">
          <h2 class="text-lg font-bold">Welcome aboard.</h2>
          <p class="mt-1 mb-2">You will first need to create a new multisig to get started.</p>
          <AddMultisigButton />
        </div>
      </Match>
      <Match when={!isLoggedIn()}>
        <div class="text-xs mx-auto text-center">
          <h2 class="text-lg font-bold">Welcome to Saturn Gateway.</h2>
          <p class="mt-1">To get started, please connect your wallet.</p>
          <ConnectWallet inMultisig={true} />
        </div>
      </Match>
    </Switch>
  );
};

Welcome.displayName = 'Welcome';
export default Welcome;