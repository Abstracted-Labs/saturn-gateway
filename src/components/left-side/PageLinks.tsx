import { pages } from "../../pages/pages";
import { A } from "@solidjs/router";
import { For, JSXElement, createEffect } from "solid-js";
import { AssetsIcon } from '../../components/svg-icons/AssetsIcon';
import { TransactionsIcon } from '../../components/svg-icons/TransactionsIcon';
import { MembersIcon } from '../../components/svg-icons/MembersIcon';
import { SettingsIcon } from '../../components/svg-icons/SettingsIcon';
import styles from '../../App.module.css';

import { useSaturnContext } from "../../providers/saturnProvider";

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

    const buildHref = (page: string): string => {
        return `/${saturnContext.state.multisigId?.toString()}/${page}`
    };

        return <div class={`${ styles.pageListContainer } mb-5`}>
            <h5 class="text-sm mb-2 text-black dark:text-saturn-offwhite">Menu</h5>
            <For each={pages}>
                {(page) => (
                    <A
                        href={buildHref(page)}
                        class={styles.pageItemContainer}
                        activeClass={`${ styles.enabled } rounded-lg border-2 border-saturn-purple bg-gray-200 dark:bg-saturn-darkgrey`}
                    >
                        {/* <div class={styles.selectedItemGradient} /> */}
                        <div class={styles.selectedItemIndicator} />
                        {matchIconToPage(page)}
                        <span class="ml-4 text-saturn-black dark:text-saturn-offwhite">{page}</span>
                    </A>
                )}
            </For>
        </div>;
};

PageLinks.displayName = 'PageLinks';
export default PageLinks;
