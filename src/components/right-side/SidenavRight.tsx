const SidenavRight = () => {
  return <aside class="fixed top-0 right-0 z-40 w-72 h-screen mt-24 transition-transform -translate-x-full sm:translate-x-0">
    <div class="h-full px-3 py-4 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black text-saturn-black dark:text-saturn-offwhite">
      hello right side
    </div>
  </aside>;
};
SidenavRight.displayName = 'SidenavRight';
export default SidenavRight;