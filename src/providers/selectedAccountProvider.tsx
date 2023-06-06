import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type BaseWallet, type Account } from '@polkadot-onboard/core';

export const SelectedAccountContext = createContext<{
    state: { selectedAccount?: Account; selectedWallet?: BaseWallet },
    setters: any,
}>({ state: {}, setters: {} });

export function SelectedAccountProvider(props: any) {
    const [state, setState] = createStore<{ selectedAccount?: Account; selectedWallet?: BaseWallet }>({});

    const value = {
      state,
       setters: {
           setSelectedAccount(account: Account) {
               setState("selectedAccount", account);
           },

           setSelectedWallet(wallet: BaseWallet) {
               setState("selectedWallet", wallet);
           }
       }
    };

    return (
        <SelectedAccountContext.Provider value={value}>
            {props.children}
        </SelectedAccountContext.Provider>
    );
}

export function useSelectedAccountContext() {
    const context = useContext(SelectedAccountContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
