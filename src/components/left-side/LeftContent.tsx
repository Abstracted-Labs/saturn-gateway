import AddMultisigButton from "./AddMultisigButton";
import ExternalLinks from "./ExternalLinks";
import MultisigList from "./MultisigList";
import ColorSwitch from "./ColorSwitch";

const LeftContent = () => {
  return <div class={`h-[87%] px-5 pt-4 pb-10 lg:pb-2 overflow-y-scroll flex flex-col bg-saturn-offwhite dark:bg-saturn-black`}
  >
    <MultisigList />
    <AddMultisigButton />
    <ExternalLinks />
    <ColorSwitch />
  </div >;
};

LeftContent.displayName = "LeftContent";
export default LeftContent;