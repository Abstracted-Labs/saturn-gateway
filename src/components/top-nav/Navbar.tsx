import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";

const Navbar = ({ ...props }) => {
  return <>
    <nav {...props} class="bg-saturn-offwhite dark:bg-saturn-black sticky w-full z-50 top-0 left-0">
      <div class="px-3 py-3 lg:px-5 lg:pl-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center justify-start">
            <SaturnLogo />
          </div>
        </div>
      </div>
      <SubNavbar />
    </nav>

  </>;
};
Navbar.displayName = 'Navbar';
export default Navbar;