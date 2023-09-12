import { createSignal } from "solid-js";

interface ISaturnAccordionItemProps {
  heading: string;
  contentId: string;
  headingId: string;
  children: any;
  onClick?: () => void;
}

const SaturnAccordionItem = (props: ISaturnAccordionItemProps) => {
  const [itemActive, setItemActive] = createSignal(false);

  function handleClick() {
    setItemActive(!itemActive());
  }

  return <>
    <h3 id={props.headingId} onClick={props.onClick}>
      <button type="button" class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" data-accordion-target={`#${ props.contentId }`} aria-expanded="false" aria-controls={props.contentId} onClick={handleClick}>
        <span>{props.heading}</span>
        <svg data-accordion-icon class={`w-6 h-6 shrink-0 transition-transform ${ itemActive() ? 'rotate-180' : 'rotate-0' }`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      </button>
    </h3>
    <div class="hidden transition-all" id={props.contentId} aria-labelledby={props.headingId}>
      {props.children}
    </div>
  </>;

  return <div class="flex flex-col">
    {props.children}
    {/* <div class="flex flex-row">
      call data
      <div class="max-h-[300px] overflow-scroll">
        <FormattedCall call={processCallData(pc.details.actualCall as unknown as Call)} />
      </div>
      votes history
    </div>
    <div class="flex flex-row">
      progress details
      % needed
    </div>
    <div class="flex flex-row">
      aye vote button
      nay vote button
    </div> */}
  </div>;
};

SaturnAccordionItem.displayName = 'SaturnAccordionItem';
export default SaturnAccordionItem;