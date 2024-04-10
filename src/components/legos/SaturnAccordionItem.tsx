import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";

interface ISaturnAccordionItemProps {
  heading: string;
  contentId: string;
  headingId: string;
  children: any;
  icon?: string[];
  onClick: () => void;
  active: boolean | undefined;
}

const SaturnAccordionItem = (props: ISaturnAccordionItemProps) => {

  const handleAccordionItemClick = () => {
    if (props.onClick) {
      props.onClick();
    }
  };

  return <>
    <h3 id={props.headingId} onClick={handleAccordionItemClick} class="text-sm">
      <button type="button" class="flex items-center justify-between w-full px-3 py-2 font-medium text-left text-black dark:text-white hover:text-white dark:hover:text-white hover:bg-saturn-purple dark:hover:bg-saturn-purple border-b border-px border-gray-200 dark:border-gray-800 focus:outline-none" data-accordion-target={`#${ props.contentId }`} aria-expanded="true" aria-controls={props.contentId}>
        <span class="flex items-center text-xs/tight">
          {props.icon && <img src={props.icon[0]} class="mr-2 rounded-full w-6 h-6 p-1 bg-black" alt="asset-icon" />}
          {props.heading}
        </span>
        <svg data-accordion-icon class={`w-6 h-6 shrink-0 transition-transform ${ props.active ? 'rotate-180' : 'rotate-0' }`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </h3>
    <div class="hidden transition-all" id={props.contentId} aria-labelledby={props.headingId}>
      {props.children}
    </div>
  </>;
};

SaturnAccordionItem.displayName = 'SaturnAccordionItem';
export default SaturnAccordionItem;