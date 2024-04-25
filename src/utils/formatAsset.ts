import BigNumber from "bignumber.js";

export function formatAsset(balance: string, assetDecimals: number, decimalsToShow: number = 4) {
  return BigNumber(balance).div(BigNumber('10').pow(BigNumber(assetDecimals))).toFormat(decimalsToShow, { decimalSeparator: '.', groupSeparator: ',', groupSize: 3 });
}