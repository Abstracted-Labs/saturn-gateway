import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SidenavRight";
import { useLocation } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import CryptoAccounts from "../modals/CryptoAccounts";
import ProposeModal from "../modals/ProposeModal";
import { Portal } from "solid-js/web";

const Layout = ({ children }: { children: any; }) => {
  const location = useLocation();

  const showRightSide = createMemo(() => {
    return location.pathname !== '/' && !location.pathname.endsWith('create') && !location.pathname.endsWith('settings');
  });
  const atHome = createMemo(() => {
    return location.pathname === '/';
  });

  return <div>
    {/* Portal elements */}
    <Portal mount={document.getElementById('accountsWindow') || undefined}>
      <CryptoAccounts />
    </Portal>
    <Portal mount={document.getElementById('proposeWindow') || undefined}>
      <ProposeModal />
    </Portal>

    {/* Top nav */}
    <Navbar />

    <div>
      {/* Left side */}
      <Show when={!atHome()}>
        <div class="hidden lg:block">
          <SidenavLeft />
        </div>
      </Show>

      {/* Main content */}
      <div class={`lg:w-auto ${ atHome() ? '' : 'lg:ml-[288px] lg:mr-[353px]' }`}>
        {children}
      </div>

      {/* Right side */}
      <Show when={showRightSide() && !atHome()}>
        <div class="hidden lg:block">
          <SidenavRight />
        </div>
      </Show>
    </div>
  </div>;
};

Layout.displayName = "Layout";
export default Layout;