import { A } from "@solidjs/router";
import { For, JSXElement } from "solid-js";
import styles from '../../App.module.css';
import { AssetsIcon } from '../../components/svg-icons/AssetsIcon';
import { TransactionsIcon } from '../../components/svg-icons/TransactionsIcon';
import { MembersIcon } from '../../components/svg-icons/MembersIcon';
import { SettingsIcon } from '../../components/svg-icons/SettingsIcon';
import ExternalLinkIcon from '../../assets/icons/external-link-icon-16x16.svg';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import ColorSwitch from "./ColorSwitch";

const pages = [
  "assets",
  "transactions",
  "members",
  "settings",
];

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

const SidenavLeft = () => {
  return <aside id="left-sidebar" class="fixed top-0 left-0 z-40 w-72 h-screen mt-24 transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
    <div class="h-full px-3 py-4 px-5 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
      <div class="grid grid-cols-1 gap-12">
        {/* pages */}
        <div class={styles.pageListContainer}>
          <For each={pages}>
            {(page) => (
              <A
                href={`4/${ page }`}
                class={styles.pageItemContainer}
                activeClass={styles.enabled}
              >
                <div class={styles.selectedItemGradient} />
                <div class={styles.selectedItemIndicator} />
                {matchIconToPage(page)}
                <span class="ml-4 text-saturn-black dark:text-saturn-offwhite">{page}</span>
              </A>
            )}
          </For>
        </div>

        <div>
          {/* add new multisig button */}
          <button type="button" class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center">
            <img src={AddMultisigIcon} alt="add-multisig-icon" width={12} height={12} class="mr-2" />
            <span>Add Multisig</span>
          </button>

          {/* external links */}
          <ul class="space-y-0.5 text-sm">
            <li class="text-saturn-lightgrey hover:text-saturn-yellow">
              <a href="#" class="flex items-center py-2 rounded-md">
                <span class="mr-2">Docs</span>
                <img src={ExternalLinkIcon} alt="external-link-icon" />
              </a>
            </li>
            <li class="text-saturn-lightgrey hover:text-saturn-yellow">
              <a href="#" class="flex items-center py-2 rounded-md">
                <span class="mr-2">Support</span>
                <img src={ExternalLinkIcon} alt="external-link-icon" />
              </a>
            </li>
            <li class="text-saturn-lightgrey hover:text-saturn-yellow">
              <a href="#" class="flex items-center py-2 rounded-md">
                <span class="mr-2">𝕏</span>
                <img src={ExternalLinkIcon} alt="external-link-icon" />
              </a>
            </li>
            <li class="text-saturn-lightgrey hover:text-saturn-yellow">
              <a href="#" class="flex items-center py-2 rounded-md">
                <span class="mr-2">Discord</span>
                <img src={ExternalLinkIcon} alt="external-link-icon" />
              </a>
            </li>
          </ul>

          {/* theme switcher */}
          <div class="mt-4">
            <ColorSwitch />
          </div>
        </div>
      </div>
    </div>
  </aside>;
};
SidenavLeft.displayName = "SidenavLeft";
export default SidenavLeft;
