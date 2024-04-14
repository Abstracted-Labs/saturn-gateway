import AddMultisigButton from "./AddMultisigButton";
import ExternalLinks from "./ExternalLinks";
import MultisigList from "./MultisigList";
import ColorSwitch from "./ColorSwitch";
import { Show } from "solid-js";
import PageLinks from "./PageLinks";

const LeftContent = (props: { inDrawer: boolean; }) => {
  return <div class={`px-5 py-3 pb-10 lg:pb-2 flex flex-col justify-between bg-transparent ${ props.inDrawer ? 'overflow-y-hidden' : 'overflow-y-hidden' }`}
  >
    <Show when={props.inDrawer}>
      <span id="inDrawer" />
    </Show>
    <MultisigList isInModal={false} />
    <div>
      <PageLinks />
      <AddMultisigButton isInModal={false} />
      <ExternalLinks />
      <ColorSwitch />
    </div>
  </div >;
};

LeftContent.displayName = "LeftContent";
export default LeftContent;