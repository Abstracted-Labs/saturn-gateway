import { Show, createMemo } from "solid-js";
import ChangeNetworkButton from "./ChangeNetworkButton";
import ConnectWallet from "./ConnectWallet";
import NotifyButton from "./NotifyButton";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";
import { useLocation } from "@solidjs/router";

const Navbar = (props: any) => {
  const loc = useLocation();
  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  return <>
    <nav {...props} class={`${ atHome() ? 'bg-transparent backdrop-blur' : 'bg-saturn-offwhite dark:bg-saturn-black' } sticky z-50 top-0 left-0`}>
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="">
            <SaturnLogo />
          </div>
          <div class="flex flex-row items-center gap-2">
            <Show when={!atHome()}>
              <NotifyButton />
              <ChangeNetworkButton />
            </Show>
            <Show when={atHome()}>
              <div class="text-white mr-3 text-xs lg:text-sm xs:hidden md:block">Saturn SDK Gateway</div>
            </Show>
            <ConnectWallet />
          </div>
        </div>
      </div>
      <Show when={!atHome()}>
        <SubNavbar />
      </Show>
    </nav>
  </>;
};

Navbar.displayName = 'Navbar';
export default Navbar;
