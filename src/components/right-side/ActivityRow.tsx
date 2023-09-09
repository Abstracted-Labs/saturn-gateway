type ActivityRowProps = {
  timestamp: string;
  aye: boolean;
  activity: string;
};

const ActivityRow = (props: ActivityRowProps) => {
  return <div class="flex flex-col w-[313.65px] border-b border-px border-gray-800 pb-3 mb-3">
    <div class="flex flex-row mb-1">
      <div class="text-saturn-lightgrey text-xxs flex flex-row justify-between w-full">
        <span>{props.timestamp}</span>
        <span class="float-right">
          <span>Voted {' '}</span>
          <span class={`${ props.aye ? 'text-saturn-green' : 'text-saturn-red' }`}>
            {props.aye ? 'Aye' : 'Nay'}
          </span>
        </span>
      </div>
    </div>
    <span class="text-xs">Executed {props.activity} call</span>
  </div>;
};

ActivityRow.displayName = 'ActivityRow';
export default ActivityRow;
