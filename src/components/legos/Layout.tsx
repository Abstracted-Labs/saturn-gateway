import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SidenavRight";

const Layout = ({ children }: { children: any; }) => {
  return <div>
    {/* Top nav */}
    <Navbar />

    <div class="grid lg:grid-cols-5">
      {/* Left side */}
      <div class="lg:col-span-1 hidden lg:block">
        <SidenavLeft />
      </div>

      {/* Main content */}
      <div class="lg:col-span-3 mt-18">
        {children}
      </div>

      {/* Right side */}
      <div class="lg:col-span-1 hidden lg:block">
        <SidenavRight />
      </div>
    </div>
  </div>;
};
Layout.displayName = "Layout";
export default Layout;