import LeftContent from "./LeftContent";

const SidenavLeft = () => {
  return <aside id="left-sidebar" class="fixed top-0 left-0 z-40 w-72 h-screen mt-36 md:mt-24 transition-transform -translate-x-full sm:translate-x-0" aria-label="left-sidebar">
    <LeftContent />
  </aside>;
};
SidenavLeft.displayName = "SidenavLeft";
export default SidenavLeft;
