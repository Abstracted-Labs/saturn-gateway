import LeftContent from "./LeftContent";

const SidenavLeft = () => {
  return <aside class="fixed top-0 left-0 z-40 w-72 h-screen mt-36 md:mt-24" aria-label="static-sidebar-left">
    <LeftContent />
  </aside>;
};
SidenavLeft.displayName = "SidenavLeft";
export default SidenavLeft;
