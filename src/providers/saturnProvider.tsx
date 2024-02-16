import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type Saturn, type MultisigDetails } from "@invarch/saturn-sdk";
import { MultisigItem } from "../utils/consts";

interface SaturnContextState {
  saturn?: Saturn;
  multisigId?: number;
  multisigAddress?: string;
  multisigDetails?: MultisigDetails,
  multisigItems?: MultisigItem[];
};

export type SaturnContextType = {
  state: SaturnContextState,
  setters: any,
};

export const SaturnContext = createContext<SaturnContextType>({ state: {}, setters: {} });

export function SaturnProvider(props: any) {
  const [state, setState] = createStore<SaturnContextState>({});

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
      },

      setMultisigItems(multisigItems: MultisigItem[]) {
        setState("multisigItems", multisigItems);
      },

      logout() {
        setState({
          // saturn: undefined,
          multisigId: undefined,
          multisigAddress: undefined,
          multisigDetails: undefined,
          multisigItems: undefined,
        });
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
    throw new Error("useProposeContext: cannot find a ProposeContext");
  }

  return context;
}
