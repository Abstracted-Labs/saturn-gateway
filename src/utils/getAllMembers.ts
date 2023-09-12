import { Saturn } from '@invarch/saturn-sdk';
import { MembersType } from "../pages/Members";
import BigNumber from 'bignumber.js';

export async function getAllMembers(multisigId: number, saturn: Saturn) {
  const mems = await saturn.getMultisigMembers(multisigId);

  const memsProcessedPromise = mems.map(async (m) => {
    const votes = BigNumber((await saturn.getMultisigMemberBalance({ id: multisigId, address: m })).toString());
    return {
      address: m.toHuman(),
      votes,
    };
  });

  const memsProcessed: MembersType[] = await Promise.all(memsProcessedPromise);

  return Promise.resolve(memsProcessed);
};