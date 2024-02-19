import AddMultisigButton from "./AddMultisigButton";
import ExternalLinks from "./ExternalLinks";
import MultisigList from "./MultisigList";
import ColorSwitch from "./ColorSwitch";
import { Show } from "solid-js";
import PageLinks from "./PageLinks";

const LeftContent = (props: { inDrawer: boolean; }) => {
  return <div class={`h-[87%] px-5 pt-4 pb-10 lg:pb-2 flex flex-col bg-saturn-offwhite dark:bg-saturn-black ${ props.inDrawer ? 'overflow-y-hidden' : 'mr-4 overflow-y-auto saturn-scrollbar' }`}
  >
    <Show when={props.inDrawer}>
      <span id="inDrawer" />
    </Show>
    <MultisigList />
    <PageLinks />
    <AddMultisigButton />
    <ExternalLinks />
    <ColorSwitch />
  </div >;
};

LeftContent.displayName = "LeftContent";
export default LeftContent;