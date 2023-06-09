import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type Saturn, type MultisigDetails } from "@invarch/saturn-sdk";

export type SaturnContextType = {
    state: { saturn?: Saturn; multisigId?: number; multisigAddress?: string; multisigDetails?: MultisigDetails },
    setters: any,
};

export const SaturnContext = createContext<SaturnContextType>({ state: {}, setters: {} });

export function SaturnProvider(props: any) {
    const [state, setState] = createStore<{ saturn?: Saturn; multisigId?: number; multisigAddress?: string; multisigDetails?: MultisigDetails }>({});

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
           },

           setMultisigDetails(multisigDetails: MultisigDetails) {
               setState("multisigDetails", multisigDetails);
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
