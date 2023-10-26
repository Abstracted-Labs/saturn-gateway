import { pages } from "../../pages/pages";
import { A } from "@solidjs/router";
import { For, JSXElement, Show, createEffect, createMemo, createSignal } from "solid-js";
import { AssetsIcon } from '../../components/svg-icons/AssetsIcon';
import { TransactionsIcon } from '../../components/svg-icons/TransactionsIcon';
import { MembersIcon } from '../../components/svg-icons/MembersIcon';
import { SettingsIcon } from '../../components/svg-icons/SettingsIcon';
import styles from '../../App.module.css';

import { useSaturnContext } from "../../providers/saturnProvider";
import { BUTTON_COMMON_STYLE } from "../../utils/consts";

function matchIconToPage(page: string): JSXElement {
  // Assign the correct icon component to each page link
  switch (page) {
    case "assets":
      return <AssetsIcon />;
    case "transactions":
      return <TransactionsIcon />;
    case "members":
      return <MembersIcon />;
    case "settings":
      return <SettingsIcon />;
    default:
      return null;
  }
}

const PageLinks = () => {
  const saturnContext = useSaturnContext();
  const [mutateButton, setMutateButton] = createSignal(false);

  const multiSigId = createMemo(() => saturnContext.state.multisigId);

  function buildHref(page: string): string {
    if (!multiSigId()) return '';
    return `/${ saturnContext.state.multisigId?.toString() }/${ page }`;
  };

  createEffect(() => {
    const isDrawerPresent = () => !!document.getElementById('inDrawer');
    if (isDrawerPresent()) {
      setMutateButton(true);
    } else {
      setMutateButton(false);
    }
  });

  return <div class={`${ styles.pageListContainer } mb-5`}>
    <h5 class="text-sm mb-2 text-black dark:text-saturn-offwhite">Menu</h5>
    <Show when={!!multiSigId()} fallback={<div class="text-black dark:text-white text-xs">Loading pages...</div>}>
      <For each={pages}>
        {(page) => {
          return (
            <A
              href={buildHref(page)}
              class={styles.pageItemContainer}
              activeClass={`${ styles.enabled } ${ BUTTON_COMMON_STYLE }`}
              data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined}
              aria-controls={mutateButton() ? 'leftSidebar' : undefined}
            >
              {/* <div class={styles.selectedItemGradient} /> */}
              <div class={styles.selectedItemIndicator} />
              {matchIconToPage(page)}
              <span class="ml-4 text-saturn-black dark:text-saturn-offwhite">{page}</span>
            </A>
          );
        }}
      </For>
    </Show>
  </div>;
};

PageLinks.displayName = 'PageLinks';
export default PageLinks;
