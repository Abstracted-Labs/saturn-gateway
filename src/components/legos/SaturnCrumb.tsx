import { For, createMemo } from "solid-js";
import { CRUMB_STYLE } from "../../utils/consts";

interface SaturnCrumbProps {
  trail: string[];
  active: string;
  trailWidth: string;
  disabledCrumbs?: string[];
  setActive: (crumb: string) => void;
}

const SaturnCrumb = (props: SaturnCrumbProps) => {
  const filteredTrail = createMemo(() => props.trail.filter(crumb => crumb !== 'success'));
  const disabledCrumbs = createMemo(() => props.disabledCrumbs || []);

  function handleCrumbClick(crumb: string) {
    const activeCrumbElement = document.getElementById(crumb);
    if (activeCrumbElement) {
      activeCrumbElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    props.setActive(crumb);
  }

  return (
    <nav class="px-5 py-3 inline-flex w-full" aria-label="Breadcrumb">
      <ol id="breadcrumb" class={`pl-3 overflow-x-scroll overflow-y-hidden inline-flex ${ props.trailWidth } scrollbar-hide gap-2 justify-start`}>
        <For each={filteredTrail()}>
          {(crumb, index) => (
            <li aria-disabled={disabledCrumbs().includes(crumb)} id={crumb} class={`relative inline-flex items-center crumb-li w-full ${ props.active === crumb ? 'justify-center' : '' }`}>
              <span class={`absolute z-10 crumb-index border-[1px] ${ props.active === crumb ? 'bg-white text-saturn-purple border-saturn-purple' : disabledCrumbs().includes(crumb) ? 'bg-gray-200 border-gray-200 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-600' : 'bg-saturn-purple border-saturn-purple' } left-[-5px] rounded-full text-[6px] text-center left-1 pt-[1px] w-3 h-3`}>
                {index() + 1}
              </span>
              <button
                disabled={disabledCrumbs().includes(crumb)}
                type="button"
                class={`${ CRUMB_STYLE } ${ props.active === crumb ? 'bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-purple-300 text-saturn-lightgrey hover:text-saturn-purple dark:hover:bg-purple-950 hover:bg-purple-300' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-100 dark:text-gray-500 dark:hover:text-gray-400 bg-gray-100 dark:bg-gray-900 dark:hover:bg-saturn-darkpurple' }`}
                onClick={() => handleCrumbClick(crumb)}
              >
                {crumb}
              </button>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
};

SaturnCrumb.displayName = "SaturnCrumb";
export default SaturnCrumb;