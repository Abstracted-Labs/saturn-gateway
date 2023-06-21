import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type BaseWallet, type Account } from '@polkadot-onboard/core';
import { createStorageSignal, createLocalStorage } from "@solid-primitives/storage";

export const SelectedAccountContext = createContext<{
    state: { account?: Account; wallet?: BaseWallet },
    setters: any,
}>({ state: {}, setters: {} });

export function SelectedAccountProvider(props: any) {
    const [state, setState] = createStore<{ account?: Account; wallet?: BaseWallet }>({});

    const { getSelected, setSelected, clearSelected } = useSelectedAccountStorage();

    const value = {
        state: getSelected,
        setters: {
           setSelectedAccount(account: Account) {
               setState("account", account);
           },

           setSelectedWallet(wallet: BaseWallet) {
               setState("wallet", wallet);
           }
       }
    };

    return (
        <SelectedAccountContext.Provider value={value}>
            {props.children}
        </SelectedAccountContext.Provider>
    );
}

export function useSelectedAccountStorage() {
    const [storageState, setStorageState, { clear }] = createLocalStorage();

    const setSelected = (account: Account, wallet: BaseWallet) => {
        setStorageState("selectedAccount", JSON.stringify({ account, wallet }));
    };

    const getSelected = (): { account: Account, wallet: BaseWallet } | undefined => {
        const data = JSON.parse(storageState.selectedAccount);
        if (data.account && data.wallet) {
            return data;
        }
    }

    return { getSelected, setSelected, clearSelected: clear };
}

export function useSelectedAccountContext() {
    const context = useContext(SelectedAccountContext);

    if (!context) {
        throw new Error("useProposeContext: cannot find a ProposeContext")
    }

    return context;
}
