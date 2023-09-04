import { For, JSXElement, createSignal } from "solid-js";
import { BUTTON_COMMON_STYLE } from "../../utils/consts";
import { SelectOptionItem } from "./OptionItem";

export type DropdownOptionsType = HTMLOptionElement | JSXElement | string | number;

export type SimpleSelectType = {
  toggleId: string,
  dropdownId: string,
  selectOptions: DropdownOptionsType[],
  isMini?: boolean,
  initialOption?: DropdownOptionsType,
  onOptionClick: (opt?: any) => void,
};

const SimpleSelect = (props: SimpleSelectType) => {
  const [dropdownLabel, setDropdownLabel] = createSignal<DropdownOptionsType>(props.initialOption, { equals: false });

  function onOptionClick(option: any) {
    setDropdownLabel(option);
  }

  return <div>
    <label for="countries" class="sr-only block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select an option</label>
    <select id="countries" class={`${ BUTTON_COMMON_STYLE } text-sm text-saturn-black select:focus:outline-none dark:text-saturn-offwhite h-full justify-between pl-4 z-30 self-stretch ${ props.isMini ? 'text-xs' : 'text-sm' }`} onChange={(opt) => onOptionClick(opt.target.value)}>
      <option selected>{dropdownLabel()}</option>
      {props.selectOptions ? <For each={props.selectOptions} fallback={'...'}>
        {(option, index) => <SelectOptionItem value={option as any} />}
      </For> : null}
    </select>
  </div>;
};

SimpleSelect.displayName = 'SimpleSelect';
export default SimpleSelect;