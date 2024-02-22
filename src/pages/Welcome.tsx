import { createEffect, createSignal, Switch, Match, onMount, on, onCleanup, createMemo } from "solid-js";
import ConnectWallet from "../components/top-nav/ConnectWallet";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import AddMultisigButton from "../components/left-side/AddMultisigButton";
import { useMultisigListModal } from "../providers/multisigListModalProvider";
import LoaderAnimation from "../components/legos/LoaderAnimation";

const Welcome = () => {
  const modal = useMultisigListModal();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [hasMultisigs, setHasMultisigs] = createSignal(false);
  const [isMultisigId, setIsMultisigId] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  createEffect(() => {
    setIsLoggedIn(!!selectedAccountContext.state.account?.address);
  });

  createEffect(() => {
    setIsLoading(true);
    async function checkMultisigsExist() {
      try {
        const sat = saturnContext.state.saturn;
        const address = selectedAccountContext.state.account?.address;

        if (!sat || !address) {
          setIsLoading(false);
          return;
        }

        const multisigs = await sat.getMultisigsForAccount(address);
        setHasMultisigs(multisigs.length > 0);
      } catch (error) {
        console.log("No multisigs available for this account");
        setHasMultisigs(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkMultisigsExist();
  });

  createEffect(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    const isDefined = idOrAddress !== 'undefined';
    setIsMultisigId(isDefined);
  });

  createEffect(() => {
    if (!isLoading() && isLoggedIn() && hasMultisigs() && modal) {
      modal.showModal();
    } else {
      modal.hideModal();
    }
  });

  return (
    <Switch>
      <Match when={isLoading()}>
        <div class="flex justify-center items-center h-full">
          <LoaderAnimation text="Loading..." />
        </div>
      </Match>
      <Match when={isLoggedIn() && !hasMultisigs()}>
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