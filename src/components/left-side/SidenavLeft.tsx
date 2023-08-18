import { A } from "@solidjs/router";
import { For } from "solid-js";
import styles from '../../App.module.css';
import AssetsIcon from '../../assets/icons/assets-icon-15x12.svg';
import TransactionsIcon from '../../assets/icons/transactions-icon-15x12.svg';
import MembersIcon from '../../assets/icons/members-icon-15x15.svg';
import SettingsIcon from '../../assets/icons/settings-icon-15x15.svg';
import ExternalLinkIcon from '../../assets/icons/external-link-icon-16x16.svg';
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import ColorSwitch from "./ColorSwitch";

const pages = [
  "assets",
  "transactions",
  "members",
  "settings",
];

function matchIconToPage(page: string): string {
  switch (page) {
    case "assets":
      return AssetsIcon;
    case "transactions":
      return TransactionsIcon;
    case "members":
      return MembersIcon;
    case "settings":
      return SettingsIcon;
    default:
      return SettingsIcon;
  }
}

const SidenavLeft = () => {
  return <aside id="logo-sidebar" class="fixed top-0 left-0 z-40 w-72 h-screen mt-24 transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
    <div class="h-full px-3 py-4 px-5 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
      <div class="grid grid-rows-3 grid-cols-1">
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
                <img src={matchIconToPage(page)} alt={`${ page }-icon`} class="pageIcon" />
                <span class="ml-4">{page}</span>
              </A>
            )}
          </For>
        </div>

        <div>
          {/* add new multisig */}
          <button class="bg-saturn-purple hover:bg-purple-800 text-xs p-5 mb-5 w-full rounded-md flex justify-center items-center">
            <img src={AddMultisigIcon} alt="add-multisig-icon" width={10} height={10} class="mr-2" />
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
