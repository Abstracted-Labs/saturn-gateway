import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SidenavRight";
import { useLocation } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import CryptoAccounts from "../modals/cryptoAccounts";

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

    <div class="grid lg:grid-cols-5">
      {/* Left side */}
      <div class="lg:col-span-1 hidden lg:block">
        <SidenavLeft />
      </div>

      {/* Main content */}
      <div class="lg:col-start-2 lg:col-end-5 mt-18 rounded-md">
        {children}
      </div>

      {/* Right side */}
      <Show when={showRightSide()}>
        <div class="lg:col-span-1 hidden lg:block">
          {/* <SidenavRight /> */}
        </div>
      </Show>
    </div>
  </div>;
};

Layout.displayName = "Layout";
export default Layout;