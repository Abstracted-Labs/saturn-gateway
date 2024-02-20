import { createEffect, createSignal, Switch, Match, onMount, on, onCleanup, createMemo } from "solid-js";
import ConnectWallet from "../components/top-nav/ConnectWallet";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import AddMultisigButton from "../components/left-side/AddMultisigButton";
import { useMultisigListModal } from "../providers/multisigListModalProvider";

const Welcome = () => {
  const modal = useMultisigListModal();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [hasMultisigs, setHasMultisigs] = createSignal(false);
  const [isMultisigId, setIsMultisigId] = createSignal(false);

  createEffect(() => {
    setIsLoggedIn(!!selectedAccountContext.state.account?.address);
  });

  createEffect(() => {
    async function checkMultisigsExist() {
      const sat = saturnContext.state.saturn;
      const address = selectedAccountContext.state.account?.address;

      if (!sat || !address) {
        return;
      }

      const multisigs = await sat.getMultisigsForAccount(address);
      setHasMultisigs(multisigs.length > 0);
    }

    checkMultisigsExist();
  });

  createEffect(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    setIsMultisigId(idOrAddress !== 'undefined');
  });

  createEffect(() => {
    if (isLoggedIn() && hasMultisigs() && modal) {
      modal.showModal();
    }
  });

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
          <AddMultisigButton isInModal={false} />
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