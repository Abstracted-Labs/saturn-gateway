import { encodeAddress } from "@polkadot/util-crypto";

export const encodeNativeAddress = (destination: string | null, prefix: number): string => {
  if (!destination) return "";
  try {
    return encodeAddress(destination, prefix);
  } catch {
    return destination;
  }
};
