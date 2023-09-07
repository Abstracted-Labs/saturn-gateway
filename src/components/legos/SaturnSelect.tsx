import { JSX, JSXElement, children, createMemo, mergeProps } from 'solid-js';
import { BUTTON_COMMON_STYLE } from '../../utils/consts';

export type DropdownOptionsType = JSXElement | string | null | undefined | number;

interface SaturnSelectType extends JSX.HTMLAttributes<HTMLElement | MouseEvent> {
  toggleId: string,
  dropdownId: string,
  options?: any,
  isMini?: boolean,
  initialOption?: DropdownOptionsType,
  currentSelection?: DropdownOptionsType,
  isOpen: boolean,
  disabled?: boolean,
};

const SaturnSelect = (props: SaturnSelectType) => {
  const mergedProps = mergeProps(props);
  const memoLabel = createMemo(() => mergedProps.currentSelection);
  const isOpen = createMemo(() => mergedProps.isOpen);
  const kids = children(() => mergedProps.children);
  const isDisabled = createMemo(() => mergedProps.disabled);

  return <div class={`relative grow ${ mergedProps.isMini ? 'w-auto' : 'w-full' }`}>
    <button
      disabled={isDisabled()}
      onClick={isDisabled() ? () => null : mergedProps.onClick}
      data-dropdown-offset-distance="-7"
      id={mergedProps.toggleId}
      data-dropdown-toggle={mergedProps.dropdownId}
      class={`${ isDisabled() ? 'border-none' : null } ${ BUTTON_COMMON_STYLE } justify-between px-3 text-saturn-black dark:text-saturn-offwhite h-full z-30 focus:outline-none ${ mergedProps.isMini ? 'py-1 w-28' : 'py-auto w-44' }`}
      type="button">
      <span class={`inline-flex items-center mr-2 ${ mergedProps.isMini ? 'text-xxs' : 'text-sm' }`}>
        {memoLabel() || props.initialOption}
      </span>
      <svg data-accordion-icon class={`transition-all ${ mergedProps.isMini ? 'w-2 h-2' : 'w-3 h-3' } ${ isOpen() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
      </svg>
    </button>
    <div id={mergedProps.dropdownId} aria-labelledby={mergedProps.toggleId} class={`${ BUTTON_COMMON_STYLE } hidden z-80 divide-y rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none pt-1.5 z-50 ${ mergedProps.isMini ? 'w-28' : 'w-44' }`}>
      <ul class={`${ mergedProps.isMini ? 'text-xxs' : 'text-sm' } text-gray-700 w-full dark:text-gray-200`}>
        {kids()}
      </ul>
    </div>
  </div >;
};

SaturnSelect.displayName = 'SaturnSelect';
export default SaturnSelect;