import { useLocation } from "@solidjs/router";
import { createMemo } from "solid-js";
import AssetsContext from "./AssetsContext";
import TransactionsContext from "./TransactionsContext";
import MembersContext from "./MembersContext";
import { initDropdowns } from 'flowbite';

const RightContent = () => {
  const location = useLocation();
  const currentPage = createMemo(() => location.pathname);

  const PageContext = () => {
    if (currentPage().endsWith('/assets')) {
      return <AssetsContext />;
    } else if (currentPage().endsWith('/transactions')) {
      return <TransactionsContext />;
    } else if (currentPage().endsWith('/members')) {
      return <MembersContext />;
    } else {
      return null;
    }
  };

  return <div class="h-full px-3 py-2 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
    <div class="grid grid-cols-1 gap-12 text-black dark:text-white">
      <PageContext />
    </div>
  </div>;
};

RightContent.displayName = "RightContent";
export default RightContent;