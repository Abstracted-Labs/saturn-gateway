import { createEffect, createSignal } from 'solid-js';
import YAML from 'yaml';
import type { Call } from '@polkadot/types/interfaces';
import { useSaturnContext } from '../../providers/saturnProvider';
import { AnyJson } from '@polkadot/types/types';

export type FormattedCallProps = {
  call: Call;
  hash?: string;
  multisigId?: number;
};

export default function FormattedCall(props: FormattedCallProps) {
  const [formattedCall, setFormattedCall] = createSignal({});
  const sat = useSaturnContext();

  const fetchAndFormatCall = async () => {
    const ac = props.call.toHuman();
    const detailsWithoutReference = JSON.parse(JSON.stringify(ac.args));
    let renamedObject = {
      // pallet: ac.section,
      action: ac.method,
      details: detailsWithoutReference,
      ref: '',
    };

    if (props.multisigId && 'call_hash' in detailsWithoutReference) {
      try {
        const details = await sat.state.saturn?.getPendingCall({ id: props.multisigId, callHash: detailsWithoutReference.call_hash });
        if (details && props.multisigId) {
          const moreDetails = await sat.state.saturn?.getPendingCall({ id: props.multisigId, callHash: details.actualCall.hash });
          if (moreDetails) {
            renamedObject.details = JSON.parse(JSON.stringify(moreDetails.actualCall.toHuman())).args;
          }
        }
      } catch (error) {
        console.error('Error fetching call details:', error);
      }
    }

    if (props.hash) {
      renamedObject.ref = props.hash;
    }

    setFormattedCall(renamedObject);
  };

  createEffect(() => {
    fetchAndFormatCall();
  });

  return (
    <pre class='whitespace-break-spaces break-all text-xs h-full'>
      <code class='inline-flex text-left items-center space-x-4 bg-gray-100 dark:bg-gray-900 dark:text-white text-black rounded-lg px-4 py-3 w-[100%] h-full'>
        {YAML.stringify(formattedCall(), null, { lineWidth: 0, indent: 2 }) || ''}
      </code>
    </pre>
  );
}