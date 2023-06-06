import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type Saturn } from "@invarch/saturn-sdk";

export const SaturnContext = createContext<{
    state: { saturn?: Saturn, multisigId?: number, multisigAddress?: string },
    setters: any,
}>({ state: {}, setters: {} });

export function SaturnProvider(props: any) {
    const [state, setState] = createStore<{ saturn?: Saturn, multisigId?: number, multisigAddress?: string }>({});

    const value = {
      state,
       setters: {
           setSaturn(saturn: Saturn) {
               setState("saturn", saturn);
           },

           setMultisigId(multisigId: number) {
               setState("multisigId", multisigId);
           },

           setMultisigAddress(multisigAddress: string) {
               setState("multisigAddress", multisigAddress);
           }
       }
    };

    return (
        <SaturnContext.Provider value={value}>
            {props.children}
        </SaturnContext.Provider>
    );
}

export function useSaturnContext() {
    const context = useContext(SaturnContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
