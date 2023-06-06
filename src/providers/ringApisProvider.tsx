import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";
import type Web3WalletType from '@walletconnect/web3wallet';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { ApiPromise } from '@polkadot/api';

export const RingApisContext = createContext<{
    state: { [ring: string]: ApiPromise },
    setters: any,
}>({ state: {}, setters: {} });

export function RingApisProvider(props: any) {
    const [state, setState] = createStore<{ [ring: string]: ApiPromise }>({});

    const value = {
      state,
       setters: {
           setRingApi(ring: string, api: ApiPromise) {
               setState(ring, api);
           },

           setRingApisBatch(ringApis: Record<string, ApiPromise>) {
               for (const [r, a] of Object.entries(ringApis)) {
                   setState(r, a);
               }
           }
       }
    };

    return (
        <RingApisContext.Provider value={value}>
            {props.children}
        </RingApisContext.Provider>
    );
}

export function useRingApisContext() {
    const context = useContext(RingApisContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
