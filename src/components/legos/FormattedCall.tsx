import YAML from 'yaml';
import type { Call } from '@polkadot/types/interfaces';

export type FormattedCallProps = {
  call: Call;
};

export default function FormattedCall(props: FormattedCallProps) {
  return (
    <pre class='whitespace-break-spaces break-all'>
      <code
        class='text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-4 pl-6 w-[100%]'
      >
        {YAML.stringify(
          (() => {
            const objectOrder = {
              section: null,
              method: null,
              args: null,
            };

            const ac = props.call.toHuman();

            return Object.assign(
              objectOrder,
              ac,
            );
          })()
          , null,
          { lineWidth: 0, indent: 2 }) || ''}
      </code>
    </pre>
  );
}
