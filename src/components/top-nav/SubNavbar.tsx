const SubNavbar = ({ ...props }) => {
  return <nav {...props} class="bg-saturn-purple sticky w-full h-12 z-48 top-0 left-0 flex md:hidden">
    {/* <div class="px-3 py-3 lg:px-5 lg:pl-3"> */}
    <div class="flex items-center justify-between">
      {/* left side */}
      <div class="flex items-center">
        <button data-drawer-target="left-sidebar" data-drawer-toggle="left-sidebar" aria-controls="left-sidebar" type="button" class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
          <span class="text-white">Open sidebar</span>
        </button>
      </div>
    </div>
    {/* </div> */}
  </nav>;
};
SubNavbar.displayName = 'SubNavbar';
export default SubNavbar;