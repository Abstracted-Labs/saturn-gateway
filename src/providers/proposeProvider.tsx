import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";

export const ProposeContext = createContext<[{ proposalCall?: Uint8Array | MultisigCall }, {
    openProposeModal(proposalCall: Uint8Array | MultisigCall): void;
    closeProposeModal(): void;
} | {}]>([{}, {}]);

export type ProposeProviderProps = {
    children: any
};

export function ProposeProvider(props: ProposeProviderProps) {
    const [state, setState] = createStore<{ proposalCall?: Uint8Array | MultisigCall }>({});

    const proposal: [{ proposalCall?: Uint8Array | MultisigCall }, {
        openProposeModal(proposalCall: Uint8Array | MultisigCall): void;
        closeProposeModal(): void;
    }] = [
        state,
        {
            openProposeModal(proposalCall: Uint8Array | MultisigCall) {
                setState({ proposalCall });
            },
            closeProposeModal() {
                setState({ proposalCall: undefined });
            },
        },
    ];
    return (
        <ProposeContext.Provider value={proposal}>
            {props.children}
        </ProposeContext.Provider>
    );
}

export function useProposeContext(): [{ proposalCall?: Uint8Array | MultisigCall }, {
    openProposeModal(proposalCall: Uint8Array | MultisigCall): void;
    closeProposeModal(): void;
}] {
    const context = useContext(ProposeContext) as [{ proposalCall?: Uint8Array | MultisigCall }, {
        openProposeModal(proposalCall: Uint8Array | MultisigCall): void;
        closeProposeModal(): void;
    }];
    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }
    return context;
}
