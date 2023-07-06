import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type BaseWallet, type Account } from '@polkadot-onboard/core';
import { createLocalStorage } from "@solid-primitives/storage";

export const SelectedAccountContext = createContext<{
    state: { account?: Account; wallet?: BaseWallet },
    setters: any,
}>({ state: {}, setters: {} });

export function SelectedAccountProvider(props: any) {
    const [state, setState] = createStore<{ account?: Account; wallet?: BaseWallet }>({});

    const [storageState, setStorageState, { clear }] = createLocalStorage();

    const getSelectedStorage = (): { address: string, wallet: string } | undefined => {
        const data = JSON.parse(storageState.selectedAccount);
        if (data.address && data.wallet) {
            return data;
        }
    }

    const value = {
        state,
        setters: {
            setSelected(account: Account, wallet: BaseWallet) {
                setState("account", account);
                setState("wallet", wallet);

                setStorageState("selectedAccount", JSON.stringify({ address: account.address, wallet: wallet.metadata.title }));
            },

            getSelectedStorage,

            clearSelected() {
                setState({});
                clear();
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
