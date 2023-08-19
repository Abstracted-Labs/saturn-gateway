import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SideNavRight";

const Layout = ({ children }: { children: any; }) => {
  return <div>
    {/* Top nav */}
    <Navbar />
    <div class="grid md:grid-cols-5">
      {/* Left side */}
      <div class="md:col-span-1">
        <SidenavLeft />
      </div>
      {/* Main content */}
      <div class="md:col-span-3 mt-18">
        {children}
      </div>
      {/* Right side */}
      <div class="md:col-span-1">
        <SidenavRight />
      </div>
    </div>
  </div>;
};
Layout.displayName = "Layout";
export default Layout;