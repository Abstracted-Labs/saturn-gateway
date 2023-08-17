import Navbar from "./Navbar";

const Layout = ({ children }: { children: any; }) => {
  return <div>
    <Navbar />
    <div class="mt-24">
      {children}
    </div>
  </div>;
};
Layout.displayName = "Layout";
export default Layout;