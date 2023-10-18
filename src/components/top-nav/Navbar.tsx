import { Show, createMemo } from "solid-js";
import ChangeNetworkButton from "./ChangeNetworkButton";
import ConnectWallet from "./ConnectWallet";
import NotifyButton from "./NotifyButton";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";
import { useLocation } from "@solidjs/router";
import MobileMenu from "./MobileMenu";

const Navbar = (props: any) => {
  const loc = useLocation();
  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  return <>
    <nav {...props} class={`${ atHome() ? 'bg-transparent backdrop-blur' : 'bg-saturn-offwhite dark:bg-saturn-black' } sticky z-50 top-0 left-0`}>
      <div class="py-3 px-5">
        <div class={`flex items-center ${ atHome() ? 'justify-center' : 'justify-between' }`}>
          <div class="">
            <SaturnLogo />
          </div>
          <Show when={!atHome()}>
            {/* <MobileMenu> */}
            <div class="flex flex-row items-center gap-2 z-1">
              {/* <NotifyButton /> */}
              {/* <ChangeNetworkButton /> */}
              <ConnectWallet inMultisig={false} />
            </div>
            {/* </MobileMenu> */}
          </Show>
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
