import { Show, createMemo, createSignal } from "solid-js";
import ConnectWallet from "./ConnectWallet";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";
import { useLocation } from "@solidjs/router";

const Navbar = (props: any) => {
  const [open, setOpen] = createSignal(false);
  const loc = useLocation();

  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  const lessThanSm = createMemo(() => {
    const width = window.innerWidth;
    return width < 414;
  });

  return <>
    <nav {...props} class={`${ atHome() ? 'bg-transparent backdrop-blur' : 'bg-saturn-offwhite dark:bg-saturn-black' } sticky z-50 top-0 left-0`}>
      <div class="py-3 px-5">
        <div class={`flex items-center ${ atHome() ? 'justify-center' : 'justify-between' }`}>
          <div class={`${ open() && lessThanSm() ? 'invisible' : '' }`}>
            <SaturnLogo />
          </div>
          <Show when={!atHome()}>
            {/* <MobileMenu> */}
            <div class="flex flex-row items-center gap-2 z-1">
              {/* <NotifyButton /> */}
              {/* <ChangeNetworkButton /> */}
              <ConnectWallet isOpen={(open) => setOpen(open)} inMultisig={false} />
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
