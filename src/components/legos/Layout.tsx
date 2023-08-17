import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";

const Layout = ({ children }: { children: any; }) => {
  return <div>
    <Navbar />
    <SidenavLeft />
    <div class="mt-24">
      {children}
    </div>
  </div>;
};
Layout.displayName = "Layout";
export default Layout;