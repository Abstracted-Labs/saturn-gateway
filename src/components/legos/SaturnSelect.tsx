import { For, JSX, JSXElement, Ref, Show, children, createEffect, createMemo, createSignal, lazy, mergeProps, on, onMount } from 'solid-js';
import { BUTTON_COMMON_STYLE } from '../../utils/consts';

export type DropdownOptionsType = JSXElement | string | null | undefined | number;

interface SaturnSelectType extends JSX.HTMLAttributes<HTMLElement> {
  toggleId: string,
  dropdownId: string,
  options?: any,
  isMini?: boolean,
  initialOption?: DropdownOptionsType,
  currentSelection?: DropdownOptionsType,
  isOpen: boolean,
};

const SaturnSelect = (props: SaturnSelectType) => {
  const memoLabel = createMemo(() => props.currentSelection);
  const isOpen = createMemo(() => props.isOpen);
  const mergedProps = mergeProps(props);
  const kids = children(() => mergedProps.children);

  return <div class="relative flex flex-col w-44">
    <button
      onClick={mergedProps.onClick}
      data-dropdown-offset-distance="-7"
      id={mergedProps.toggleId}
      data-dropdown-toggle={mergedProps.dropdownId}
      class={`${ BUTTON_COMMON_STYLE } text-sm text-saturn-black dark:text-saturn-offwhite h-full justify-between pl-4 z-30 focus:outline-none self-stretch ${ mergedProps.isMini ? 'text-xs' : 'text-sm' }`}
      type="button">
      <span class="mr-10 inline-flex items-center gap-1">
        {memoLabel() || props.initialOption}
      </span>
      <svg data-accordion-icon class={`transition-all w-3 h-3 ${ isOpen() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-4`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
      </svg>
    </button>
    <div id={mergedProps.dropdownId} aria-labelledby={mergedProps.toggleId} class={`${ BUTTON_COMMON_STYLE } hidden divide-y rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none pt-1.5 z-50`}>
      <ul class={`${ mergedProps.isMini ? 'text-xs' : 'text-sm' } text-gray-700 dark:text-gray-2000`}>
        {kids()}
      </ul>
    </div>
  </div >;
};

SaturnSelect.displayName = 'SaturnSelect';
export default SaturnSelect;