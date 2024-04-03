import { JSX, createContext, createEffect, createMemo, onCleanup, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { createLocalStorage } from "@solid-primitives/storage";
import { Account, BaseWallet } from "@polkadot-onboard/core";
import { KusamaFeeAssetEnum, WalletNameEnum } from "../utils/consts";

export interface SelectedAccountState {
  account?: Account;
  wallet?: BaseWallet;
  feeAsset?: KusamaFeeAssetEnum;
  addressToCopy?: Element | undefined;
  enabledExtensions?: string[];
}

export const SelectedAccountContext = createContext<{
  state: SelectedAccountState,
  setters: {
    setFeeAsset: (feeAsset: KusamaFeeAssetEnum) => void,
    getFeeAsset: () => KusamaFeeAssetEnum,
    setAddressToCopy: (address: Element | undefined) => void,
    getAddressToCopy: () => Element | undefined,
    setEnabledWallets: (wallets: string[]) => void,
    getEnabledWallets: () => string[],
    setSelectedAccount: (account: Account, wallet: BaseWallet) => void,
    getSelectedStorage: () => { address: string, wallet: string; },
    clearSelected: () => void;
  },
}>({
  state: {
    account: undefined,
    wallet: undefined,
    feeAsset: KusamaFeeAssetEnum.TNKR,
    addressToCopy: undefined,
    enabledExtensions: []
  }, setters: {
    setFeeAsset: (feeAsset: KusamaFeeAssetEnum) => { },
    getFeeAsset: () => KusamaFeeAssetEnum.TNKR,
    setAddressToCopy: (address: Element | undefined) => { },
    getAddressToCopy: () => undefined,
    setEnabledWallets: (wallets: string[]) => { },
    getEnabledWallets: () => [],
    setSelectedAccount: (account: Account, wallet: BaseWallet) => { },
    getSelectedStorage: () => ({ address: '', wallet: '' }),
    clearSelected: () => { }
  }
});

export function SelectedAccountProvider(props: any) {
  const [state, setState] = createStore<SelectedAccountState>({});
  const [storageState, setStorageState, { remove }] = createLocalStorage();

  const addressToCopy = createMemo(() => state.addressToCopy);

  createEffect(() => {
    const storedExtensions = storageState["enabledExtensions"];
    if (storedExtensions) {
      const parsedExtensions = JSON.parse(storedExtensions);
      setState("enabledExtensions", parsedExtensions);
    } else {
      setState("enabledExtensions", []);
    }
  });

  createEffect(() => {
    const storedFeeAsset = storageState["feeAsset"];
    if (storedFeeAsset) {
      setState("feeAsset", storedFeeAsset as KusamaFeeAssetEnum);
    } else {
      setState("feeAsset", KusamaFeeAssetEnum.TNKR);
    }
  });

  onCleanup(() => {
    setState("addressToCopy", undefined);
  });

  const value = createMemo(() => ({
    state,
    setters: {
      setFeeAsset(feeAsset: KusamaFeeAssetEnum) {
        setState("feeAsset", feeAsset);
        setStorageState("feeAsset", feeAsset);
      },

      getFeeAsset() {
        const storageData = storageState;
        if (storageData && storageData.feeAsset) {
          setState("feeAsset", storageData.feeAsset as KusamaFeeAssetEnum);
          return storageData.feeAsset as KusamaFeeAssetEnum;
        } else {
          const defaultAsset = KusamaFeeAssetEnum.TNKR;
          setState("feeAsset", defaultAsset);
          return defaultAsset;
        }
      },

      setAddressToCopy(address: Element | undefined) {
        setState("addressToCopy", address);
      },

      getAddressToCopy() {
        const toCopy = addressToCopy();
        if (toCopy) {
          return toCopy;
        } else {
          return undefined;
        }
      },

      setEnabledWallets(wallets: string[]) {
        setState("enabledExtensions", wallets);
        setStorageState("enabledExtensions", JSON.stringify(wallets));
      },

      getEnabledWallets() {
        const storageData = storageState;
        if (storageData && storageData.enabledExtensions) {
          const wallets = JSON.parse(storageData.enabledExtensions);
          setState("enabledExtensions", wallets);
          return wallets;
        }

        setStorageState("enabledExtensions", JSON.stringify([]));
        return [];
      },

      setSelectedAccount(account: Account, wallet: BaseWallet) {
        try {
          if (account && wallet) {
            setState("account", account);
            setState("wallet", wallet);
            setStorageState("selectedAccount", JSON.stringify({ address: account.address, wallet: wallet.metadata.title === 'Omniway' ? WalletNameEnum.WALLETCONNECT : wallet.metadata.title }));
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
        // console.log("Clearing selected account...");
        // if (state.account) setState("account", undefined);
        if (state.wallet) setState("wallet", undefined);
        remove('selectedAccount');
        remove('feeAsset');
        remove('enabledExtensions');
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
