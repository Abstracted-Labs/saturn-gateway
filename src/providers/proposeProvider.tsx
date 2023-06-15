import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";
import { BN } from '@polkadot/util';
import { type BigNumber } from 'bignumber.js';

export enum ProposalType {
    LocalCall,
    LocalTransfer,
    XcmCall,
    XcmTransfer,
    XcmBridge,
};

export type ProposalData = { chain: string; encodedCall: Uint8Array } | // LocalCall | XcmCall
                           { chain: string; asset: string; amount: BN | BigNumber | string; to: string; } | // LocalTransfer | XcmTransfer
                           { chain: string; asset: string; destinationChain: string; amount: BN | BigNumber | string; to?: string; }; // XcmBridge

export class Proposal {
    proposalType: ProposalType;
    data: ProposalData

    constructor(proposalType: ProposalType, data: ProposalData) {
        this.proposalType = proposalType;
        this.data = data;
    }

};

export type OpenProposeModalType = (proposal: Proposal) => void;

export type ProposeContextType = {
    state: { proposal?: Proposal },
    setters: { openProposeModal: OpenProposeModalType; closeProposeModal: () => void },
};

export const ProposeContext = createContext<ProposeContextType>({ state: {}, setters: { openProposeModal: (_: Proposal) => {}, closeProposeModal: () => {} } });

export function ProposeProvider(props: any) {
    const [state, setState] = createStore<{ proposal?: Proposal }>({});

    const value = {
      state,
       setters: {
           openProposeModal(proposal: Proposal) {
               setState({ proposal });
           },
           closeProposeModal() {
               setState({ proposal: undefined });
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
