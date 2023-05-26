import { Show } from "solid-js";
import YAML from "yaml";
import type { Call } from "@polkadot/types/interfaces";
import type { AnyJson } from '@polkadot/types/types/codec';
import { ApiPromise } from "@polkadot/api";

export type FormattedCallProps = {
    fullCall: boolean;
    call: Call;
    ringApis: { [chain: string]: ApiPromise } | undefined;
};

export default function FormattedCall(props: FormattedCallProps) {

    const processExternalCall = (fullCall: Call, call: string): Record<string, AnyJson> | string => {
        const chain = (fullCall.toHuman()["args"] as { [index: string]: AnyJson })["destination"]?.toString().toLowerCase();

        if (!props.ringApis || !chain) return call;

        const objectOrder = {
            section: null,
            method: null,
            args: null,
        };

        return Object.assign(objectOrder, props.ringApis[chain].createType("Call", call).toHuman());
    }

    return (
        <pre class="whitespace-break-spaces break-all">
            <code
                class="text-sm sm:text-base inline-flex text-left items-center space-x-4 bg-gray-800 text-white rounded-lg p-4 pl-6 w-[100%]"
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

                                let ac = props.call.toHuman();

                                if (ac.method == "sendCall") {
                                    return Object.assign(
                                        objectOrder,
                                        processExternalCall(
                                            props.call,
                                            (ac["args"] as { [index: string]: AnyJson })["call"] as string
                                        )
                                    );
                                }

                                return Object.assign(
                                    objectOrder,
                                    ac
                                );
                            })()
                            , null, { lineWidth: 0, indent: 2 }) || ""}
                    </>
                }>
                    {YAML.stringify(
                        (() => {
                            const objectOrder = {
                                section: null,
                                method: null,
                                args: null,
                            };

                            let ac = props.call.toHuman();

                            if (ac.method == "sendCall") {
                                (ac["args"] as { [index: string]: AnyJson })["call"] = processExternalCall(
                                    props.call,
                                    (ac["args"] as { [index: string]: AnyJson })["call"] as string
                                )
                            }

                            return Object.assign(
                                objectOrder,
                                ac
                            );
                        })()
                        , null, { lineWidth: 0, indent: 2 }) || ""}
                </Show>
            </code>
        </pre>
    );
}
