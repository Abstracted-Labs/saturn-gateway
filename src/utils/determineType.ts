export function determineType(valueStr: string): 'u32' | 'u128' | 'unknown' {
  const maxU32 = 2n ** 32n - 1n;

  let valueBigInt: bigint;
  try {
    valueBigInt = BigInt(valueStr);
  } catch (e) {
    return 'unknown';
  }

  if (valueBigInt >= 0n && valueBigInt <= maxU32) {
    return 'u32';
  }
  return 'u128';
}