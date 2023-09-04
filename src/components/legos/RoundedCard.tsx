const RoundedCard = (props: { children: any, header?: string; }) => {
  return (
    <div class="bg-white dark:bg-saturn-darkgrey p-5 mb-5 rounded-lg h-fit flex flex-col self-stretch">
      {props.header ? <h3 class="text-sm text-saturn-black dark:text-saturn-offwhite mb-3">{props.header}</h3> : null}
      {props.children ? props.children : null}
    </div>
  );
};

RoundedCard.displayName = 'RoundedCard';
export default RoundedCard;