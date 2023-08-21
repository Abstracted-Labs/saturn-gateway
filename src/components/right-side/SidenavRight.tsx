import RightContent from "./RightContent";

const SidenavRight = () => {
  return <aside class="fixed top-0 right-0 z-40 w-72 h-screen md:mt-24" aria-label="static-sidebar-right">
    <RightContent />
  </aside>;
};

SidenavRight.displayName = 'SidenavRight';
export default SidenavRight;