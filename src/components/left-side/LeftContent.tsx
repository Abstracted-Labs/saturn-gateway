import ColorSwitch from "./ColorSwitch";
import AddMultisigButton from "./AddMultisigButton";
import ExternalLinks from "./ExternalLinks";
import MultisigList from "./MultisigList";
import { createMemo } from "solid-js";
import { useThemeContext } from "../../providers/themeProvider";

const LeftContent = () => {
  let scrollContainerRef: HTMLDivElement | null = null;
  const theme = useThemeContext();
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');

  return <div class={`h-[87%] px-5 pt-4 pb-10 lg:pb-2 overflow-y-scroll flex flex-col bg-saturn-offwhite dark:bg-saturn-black`}
  //  ref={scrollContainerRef!}
  //   style={{
  //     'overflow-y': 'scroll',
  //     'scrollbar-width': 'thin',
  //     '-webkit-scrollbar-width': 'thin',
  //     '-moz-scrollbar-width': 'thin',
  //     '-ms-scrollbar-width': 'thin',
  //     '-o-scrollbar-width': 'thin',
  //     '-webkit-overflow-scrolling': 'touch',
  //     'height': '87%',
  //   }}
  >
    <MultisigList />
    <AddMultisigButton />
    <ExternalLinks />
    <ColorSwitch />
  </div >;
};

LeftContent.displayName = "LeftContent";
export default LeftContent;