import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { BN } from "@polkadot/util";

export const getMultisigsForAccount = async (
  account: string,
  api: ApiPromise
): Promise<{ multisigId: number; tokens: BN; }[]> => {
  const entries = await api.query.coreAssets.accounts.entries(account);

  const mapped = entries.map(
    ([
      {
        args: [_, coreId],
      },
      tokens,
    ]) => {
      const id = coreId.toNumber();
      const free = tokens.free;
      return { multisigId: id, tokens: free };
    }
  );

  return mapped;
};