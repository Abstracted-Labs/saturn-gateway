import { useLocation } from "@solidjs/router";
import { Match, Show, Switch, createMemo } from "solid-js";
import AssetsContext from "./AssetsContext";
import TransactionsContext from "./TransactionsContext";
import MembersContext from "./MembersContext";
import { initDropdowns } from 'flowbite';

const RightContent = (props: { inDrawer: boolean; }) => {
  const location = useLocation();

  const currentPage = createMemo(() => location.pathname);

  return <div class="h-full px-5 py-2 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
    <Show when={props.inDrawer}>
      <span id="inDrawer" />
    </Show>
    <div class="grid grid-cols-1 gap-12 text-black dark:text-white">
      <Switch fallback="No data.">
        <Match when={currentPage().endsWith('/assets')}>
          <AssetsContext />
        </Match>
        <Match when={currentPage().endsWith('/transactions')}>
          <TransactionsContext />
        </Match>
        <Match when={currentPage().endsWith('/members')}>
          <MembersContext />
        </Match>
      </Switch>
    </div>
  </div>;
};

RightContent.displayName = "RightContent";
export default RightContent;