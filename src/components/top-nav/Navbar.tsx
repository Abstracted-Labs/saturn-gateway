import ChangeNetworkButton from "./ChangeNetworkButton";
import NotifyButton from "./NotifyButton";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";
import Wallet from "./Wallet";

const Navbar = ({ ...props }) => {
  return <>
    <nav {...props} class="bg-saturn-offwhite dark:bg-saturn-black sticky w-full z-50 top-0 left-0">
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="">
            <SaturnLogo />
          </div>
          <div class="flex gap-2">
            <NotifyButton />
            <ChangeNetworkButton />
            <Wallet />
          </div>
        </div>
      </div>
      <SubNavbar />
    </nav>
  </>;
};

Navbar.displayName = 'Navbar';
export default Navbar;
