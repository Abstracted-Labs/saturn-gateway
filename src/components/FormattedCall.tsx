import { Show } from 'solid-js';
import YAML from 'yaml';
import type { Call } from '@polkadot/types/interfaces';
import type { AnyJson } from '@polkadot/types/types/codec';
import { type ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic, ApiTypes } from "@polkadot/api/types";

import { useRingApisContext } from "../providers/ringApisProvider";

export type FormattedCallProps = {
	  fullCall: boolean;
	  call: SubmittableExtrinsic<ApiTypes> | Call;
};

export default function FormattedCall(props: FormattedCallProps) {
    const ringApisContext = useRingApisContext();

	  const processExternalCall = (fullCall: Call, call: string): Record<string, AnyJson> | string => {
		    const chain = (fullCall.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();

		    if (!chain || !ringApisContext.state[chain]) {
			      return call;
		    }

		    const objectOrder = {
			      section: null,
			      method: null,
			      args: null,
		    };

		    return Object.assign(objectOrder, ringApisContext.state[chain].createType('Call', call).toHuman());
	  };

	return (
		  <pre class='whitespace-break-spaces break-all'>
			    <code
				      class='text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-4 pl-6 w-[100%]'
			    >
				      <Show when={props.fullCall} fallback={
					        <>
						             {YAML.stringify(
							               (() => {
								                 const objectOrder = {
									                   section: null,
									                   method: null,
									                   args: null,
								                 };

                                 const call = ringApisContext.state.tinkernet.createType('Call', props.call);

								                 const ac = call.toHuman();

								                 if (ac.method == 'sendCall') {
									                   return Object.assign(
										                     objectOrder,
										                     processExternalCall(
											                       call,
											                       (ac.args as Record<string, AnyJson>).call as string,
										                     ),
									                   );
								                 }

								                 return Object.assign(
									                   objectOrder,
									                   ac,
								                 );
							               })()
							               , null,
							               { lineWidth: 0, indent: 2 }) || ''}
					        </>
				      }>
					        {YAML.stringify(
						          (() => {
							            const objectOrder = {
								              section: null,
								              method: null,
								              args: null,
							            };

							            const call = ringApisContext.state.tinkernet.createType('Call', props.call);

								          const ac = call.toHuman();

							            if (ac.method == 'sendCall') {
								              (ac.args as Record<string, AnyJson>).call = processExternalCall(
									                call,
									                (ac.args as Record<string, AnyJson>).call as string,
								              );
							            }

							            return Object.assign(
								              objectOrder,
								              ac,
							            );
						          })()
						          , null,
						          { lineWidth: 0, indent: 2 }) || ''}
				      </Show>
			    </code>
		  </pre>
	);
}
