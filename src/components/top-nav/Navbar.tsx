import ColorSwitch from "../left-side/ColorSwitch";
import ChangeNetworkButton from "./ChangeNetworkButton";
import ConnectWallet from "./ConnectWallet";
import NotifyButton from "./NotifyButton";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";

const Navbar = (props: any) => {
  return <>
    {/* Nav portal elements */}
    <nav {...props} class="bg-saturn-offwhite dark:bg-saturn-black sticky z-50 top-0 left-0">
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="">
            <SaturnLogo />
          </div>
          <div class="flex flex-row gap-2">
            <NotifyButton />
            <ChangeNetworkButton />
            <ConnectWallet />
          </div>
        </div>
      </div>
      <SubNavbar />
    </nav>
  </>;
};

Navbar.displayName = 'Navbar';
export default Navbar;
