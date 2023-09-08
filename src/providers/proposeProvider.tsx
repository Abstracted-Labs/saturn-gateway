import { createContext, createMemo, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";
import { BN } from '@polkadot/util';
import { type BigNumber } from 'bignumber.js';
import { NetworkEnum } from "../utils/consts";

export enum ProposalType {
  LocalCall,
  LocalTransfer,
  XcmCall,
  XcmTransfer,
  XcmBridge,
};

export type ProposalData = { chain: string; encodedCall: Uint8Array; } | // LocalCall | XcmCall
{ chain: string; asset: string; amount: BN | BigNumber | string; to: string; } | // LocalTransfer | XcmTransfer
{ chain: string; asset: string; destinationChain: string; amount: BN | BigNumber | string; to?: string; }; // XcmBridge

export class Proposal {
  proposalType: ProposalType;
  data: ProposalData;

  constructor(proposalType: ProposalType, data: ProposalData) {
    this.proposalType = proposalType;
    this.data = data;
  }

};

export type OpenProposeModalType = (proposal: Proposal) => void;

type ProposeStateType = {
  proposal?: Proposal;
  currentNetwork?: NetworkEnum;
};

type ProposeSettersType = {
  openProposeModal: (proposal: Proposal) => void,
  closeProposeModal: () => void,
  setCurrentNetwork: (network: NetworkEnum) => void,
};

export type ProposeContextType = {
  state: ProposeStateType,
  setters: ProposeSettersType,
};

const defaultState = (): ProposeContextType => ({
  state: {
    currentNetwork: NetworkEnum.KUSAMA,
  },
  setters: {
    openProposeModal: (proposal: Proposal) => { },
    closeProposeModal: () => { },
    setCurrentNetwork: (network: NetworkEnum) => { },
  }
});

export const ProposeContext = createContext<ProposeContextType>(defaultState());

export function ProposeProvider(props: any) {
  const [state, setState] = createStore<ProposeContextType>(defaultState());

  const value = createMemo(() => ({
    ...state,
    setters: {
      openProposeModal(proposal: Proposal) {
        setState('state', 'proposal', proposal);
      },
      closeProposeModal() {
        setState('state', 'proposal', undefined);
      },
      setCurrentNetwork(currentNetwork: NetworkEnum) {
        setState('state', 'currentNetwork', currentNetwork);
      }
    }
  }));

  return (
    <ProposeContext.Provider value={value()}>
      {props.children}
    </ProposeContext.Provider>
  );
}

export function useProposeContext() {
  const context = useContext(ProposeContext);

  if (!context) {
    throw new Error("useProposeContext: cannot find a ProposeContext");
  }

  return context;
}
