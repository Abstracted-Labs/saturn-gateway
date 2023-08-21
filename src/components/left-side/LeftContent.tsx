import ColorSwitch from "./ColorSwitch";
import AddMultisigButton from "./AddMultisigButton";
import ExternalLinks from "./ExternalLinks";
import PageLinks from "./PageLinks";
import MultisigList from "./MultisigList";

const LeftContent = () => {
  return <div class="h-full px-5 pt-4 pb-32 overflow-y-scroll flex flex-col bg-saturn-offwhite dark:bg-saturn-black content-evenly">
    <MultisigList />
    <PageLinks />
    <AddMultisigButton />
    <ExternalLinks />
    <ColorSwitch />
  </div >;
};

LeftContent.displayName = "LeftContent";
export default LeftContent;