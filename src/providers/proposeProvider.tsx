import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";

export type OpenProposeModalType = (proposalCall: Uint8Array | MultisigCall, wrapped: boolean) => void;

export type ProposeContextType = {
    state: { proposalCall?: Uint8Array | MultisigCall, wrapped: boolean },
    setters: any,
};

export const ProposeContext = createContext<ProposeContextType>({ state: { wrapped: false }, setters: {} });

export function ProposeProvider(props: any) {
    const [state, setState] = createStore<{ proposalCall?: Uint8Array | MultisigCall, wrapped: boolean }>({ wrapped: false });

    const value = {
      state,
       setters: {
           openProposeModal(proposalCall: Uint8Array | MultisigCall, wrapped: boolean) {
               setState({ proposalCall, wrapped });
           },
           closeProposeModal() {
               setState({ proposalCall: undefined });
           },
       }
    };

    return (
        <ProposeContext.Provider value={value}>
            {props.children}
        </ProposeContext.Provider>
    );
}

export function useProposeContext() {
    const context = useContext(ProposeContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
