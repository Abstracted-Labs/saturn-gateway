import { JSX, JSXElement, mergeProps } from "solid-js";
import { SimpleSelectType } from "./SimpleSelect";

export const SelectOptionItem = (props: JSX.OptionHTMLAttributes<HTMLOptionElement & Partial<SimpleSelectType>>): JSX.Element => {
  return <option class="pl-4 py-2 hover:bg-saturn-darkpurple dark:text-white inline-flex items-center gap-1 w-full hover:cursor-pointer" {...props}>
    {props.value}
  </option>;
};

const OptionItem = (props: JSX.LiHTMLAttributes<HTMLLIElement>): JSXElement => {
  const mergedProps = mergeProps(props);
  return <li class="pl-4 py-2 hover:bg-saturn-darkpurple dark:text-white inline-flex items-center gap-1 w-full hover:cursor-pointer" {...mergedProps}>
    {mergedProps.children}
  </li>;
};

OptionItem.displayName = 'OptionItem';
export default OptionItem;