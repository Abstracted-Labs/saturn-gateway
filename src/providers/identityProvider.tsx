import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { AggregatedIdentity } from "../utils/identityProcessor";

export type IdentityContextType = {
    state: { identity?: AggregatedIdentity },
    setters: any,
};

export const IdentityContext = createContext<IdentityContextType>({ state: {}, setters: {} });

export function IdentityProvider(props: any) {
    const [state, setState] = createStore<{ identity?: AggregatedIdentity }>({});

    const value = {
      state,
       setters: {
           openModal(identity: AggregatedIdentity) {
               setState({ identity });
           },
           closeModal() {
               setState({ identity: undefined });
           },
       }
    };

    return (
        <IdentityContext.Provider value={value}>
            {props.children}
        </IdentityContext.Provider>
    );
}

export function useIdentityContext() {
    const context = useContext(IdentityContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
