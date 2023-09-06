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

  return <div>
    {/* Portal elements */}
    <CryptoAccounts />

    {/* Top nav */}
    <Navbar />

    <div>
      {/* Left side */}
      <div class="hidden lg:block">
        <SidenavLeft />
      </div>

      {/* Main content */}
      <div class="lg:w-auto lg:ml-[288px] lg:mr-[338px]">
        {children}
      </div>

      {/* Right side */}
      <Show when={showRightSide()}>
        <div class="hidden lg:block">
          <SidenavRight />
        </div>
      </Show>
    </div>
  </div>;
};

Layout.displayName = "Layout";
export default Layout;