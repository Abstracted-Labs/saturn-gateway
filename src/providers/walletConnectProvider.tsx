import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";
import type Web3WalletType from '@walletconnect/web3wallet';
import { Web3Wallet } from '@walletconnect/web3wallet';

export const WalletConnectContext = createContext<{ state: { w3w?: Web3WalletType; }, setters: any; }>({ state: {}, setters: {} });

export type WalletConnectProviderProps = {
  children: any;
};

export function WalletConnectProvider(props: WalletConnectProviderProps) {
  const [state, setState] = createStore<{ w3w?: Web3WalletType; }>({});

  const value = {
    state,
    setters: {
      setWalletConnect(walletConnect: Web3WalletType, sessionProposalCallback: (proposal: any) => Promise<void>, sessionRequestCallback: (event: any) => Promise<void>) {
        const w3w = walletConnect;

        w3w.on('session_proposal', sessionProposalCallback);
        w3w.on('session_request', sessionRequestCallback);

        setState({ w3w });
      }
    }
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {props.children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnectContext() {
  const context = useContext(WalletConnectContext);

  if (!context) {
    throw new Error("useWalletConnectContext: cannot find a WalletConnectContext");
  }

  return context;
}
