import { batch, createContext, createMemo, useContext } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { StorageObject, createLocalStorage } from "@solid-primitives/storage";
import { Account } from "@polkadot-onboard/core";
import { BaseWallet } from "../lnm/wallet-connect";
import { WalletNameEnum } from "../utils/consts";

export const SelectedAccountContext = createContext<{
  state: { account?: Account; wallet?: BaseWallet; },
  setters: any,
}>({ state: {}, setters: {} });

export function SelectedAccountProvider(props: any) {
  let previousStorageState: StorageObject<string>;
  const [state, setState] = createStore<{ account?: Account; wallet?: BaseWallet; }>({});
  const [storageState, setStorageState, { remove }] = createLocalStorage();

  const value = createMemo(() => ({
    state,
    setters: {
      setSelected(account: Account, wallet: BaseWallet) {
        try {
          if (account && wallet) {
            setState("account", account);
            setState("wallet", wallet);
            setStorageState("selectedAccount", JSON.stringify({ address: account.address, wallet: wallet.metadata.title === 'Saturn Gateway' ? WalletNameEnum.WALLETCONNECT : wallet.metadata.title }));
          } else {
            throw new Error('account or wallet is not valid');
          }
        } catch (error) {
          console.error(error);
        }
      },

      getSelectedStorage() {
        const storageData = storageState;
        if (storageData && storageData.selectedAccount) {
          const data = JSON.parse(storageData.selectedAccount);
          if (data?.address && data?.wallet) {
            return data;
          }
        }
        return undefined;
      },

      clearSelected() {
        setState({
          account: undefined,
          wallet: undefined,
        });
        setStorageState("selectedAccount", JSON.stringify({ address: '', wallet: '' }));
      }
    }
  }));

  return (
    <SelectedAccountContext.Provider value={value()}>
      {props.children}
    </SelectedAccountContext.Provider>
  );
}

export function useSelectedAccountContext() {
  const context = useContext(SelectedAccountContext);

  if (!context) {
    throw new Error("useSelectedAccountContext: cannot find a SelectedAccountContext");
  }

  return context;
}
