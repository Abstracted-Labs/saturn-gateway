import YAML from 'yaml';
import type { Call } from '@polkadot/types/interfaces';

export type FormattedCallProps = {
  call: Call;
};

export default function FormattedCall(props: FormattedCallProps) {
  return (
    <pre class='whitespace-break-spaces break-all text-xs h-full'>
      <code
        class='inline-flex text-left items-center space-x-4 bg-gray-100 dark:bg-gray-900 dark:text-white text-black rounded-lg px-4 py-3 w-[100%] h-full'>
        {YAML.stringify(
          (() => {
            const ac = props.call.toHuman();
            const detailsWithoutReference = JSON.parse(JSON.stringify(ac.args));
            const renamedObject = {
              pallet: ac.section,
              action: ac.method,
              details: detailsWithoutReference,
            };

            return renamedObject;
          })()
          , null,
          { lineWidth: 0, indent: 2 }) || ''}
      </code>
    </pre>
  );
}
