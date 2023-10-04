import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SidenavRight";
import { useLocation } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import CryptoAccounts from "../modals/CryptoAccounts";

const Layout = ({ children }: { children: any; }) => {
  const location = useLocation();
  const showRightSide = createMemo(() => {
    return location.pathname !== '/' && !location.pathname.endsWith('create') && !location.pathname.endsWith('settings');
  });
  const hideLeftSide = createMemo(() => {
    return location.pathname === '/';
  });

  return <div>
    {/* Portal elements */}
    <CryptoAccounts />

    {/* Top nav */}
    <Show when={!hideLeftSide()}>
      <Navbar />
    </Show>

    <div>
      {/* Left side */}
      <Show when={!hideLeftSide()}>
        <div class="hidden lg:block">
          <SidenavLeft />
        </div>
      </Show>

      {/* Main content */}
      <div class={`lg:w-auto ${ hideLeftSide() ? '' : 'lg:ml-[288px] lg:mr-[353px]' }`}>
        {children}
      </div>

      {/* Right side */}
      <Show when={showRightSide() && !hideLeftSide()}>
        <div class="hidden lg:block">
          <SidenavRight />
        </div>
      </Show>
    </div>
  </div>;
};

Layout.displayName = "Layout";
export default Layout;