import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";

const Layout = ({ children }: { children: any; }) => {
  return <div>
    <Navbar />
    <div class="grid grid-cols-5">
      {/* Left side */}
      <div class="col-span-1">
        <SidenavLeft />
      </div>
      {/* Main content */}
      <div class="col-span-3 mt-24">
        {children}
      </div>
      {/* Right side */}
      <div class="col-span-1">
        <aside class="fixed top-0 right-0 z-40 w-72 h-screen mt-24 transition-transform -translate-x-full sm:translate-x-0">
          <div class="h-full px-3 py-4 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
            hello right side
          </div>
        </aside>
      </div>
    </div>
  </div>;
};
Layout.displayName = "Layout";
export default Layout;