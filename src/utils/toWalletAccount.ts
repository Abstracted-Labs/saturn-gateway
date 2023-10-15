import { WcAccount } from "@polkadot-onboard/wallet-connect";

export const toWalletAccount = (wcAccount: string) => {
  let address = wcAccount.split(":")[2];
  return { address };
};