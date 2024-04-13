import { AssetEnum, ExtraAssetEnum } from "../data/rings";
import { NetworkEnum } from "./consts";
import { BalanceType } from "./getBalances";

let lastRequestTime: number | null = null;
const requestInterval = 2000;

async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

export async function getCurrentUsdPrice(network: NetworkEnum) {
  const now = Date.now();
  if (lastRequestTime && now - lastRequestTime < requestInterval) {
    console.log("Request rate limited");
    return null;
  }

  lastRequestTime = now;

  if (!network || network === NetworkEnum.ASSETHUB) return null;

  let data;

  try {
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${ network }?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    const responseData = await fetchData(apiUrl);
    if (responseData) {
      data = responseData;
    } else {
      console.error("Empty response data");
      return null;
    }
  } catch (error) {
    console.log("Error fetching data:", error);
    return null;
  }

  return data;
}

export const EXTRA_COINGECKO_TOKENS: [ExtraAssetEnum, string][] = [
  [ExtraAssetEnum.ZLK, 'zenlink-network-token']
];

export async function getAllUsdPrices(): Promise<Record<NetworkEnum | ExtraAssetEnum, { usd: string; }> | null> {
  const networks = Object.values(NetworkEnum);
  let filteredNetworks: string[] = networks.filter(network => network !== NetworkEnum.ASSETHUB);
  const now = Date.now();

  // Map network names to CoinGecko ids
  filteredNetworks = filteredNetworks.map(network => {
    switch (network) {
      case NetworkEnum.TINKERNET:
        return "tinkernet";
      case NetworkEnum.BASILISK:
        return "hydra";
      case NetworkEnum.PICASSO:
        return "picasso";
      case NetworkEnum.KUSAMA:
        return "kusama";
      case NetworkEnum.BIFROST:
        return "bifrost-native-coin";
      case NetworkEnum.SHIDEN:
        return "shiden";
      case NetworkEnum.KARURA:
        return "karura";
      case NetworkEnum.MOONRIVER:
        return "moonriver";
      case NetworkEnum.TURING:
        return "turing-network";
      case NetworkEnum.KHALA:
        return "pha";
      default:
        return network;
    }
  });

  // Also fetch extra custom tokens
  EXTRA_COINGECKO_TOKENS.forEach(token => {
    filteredNetworks.push(token[1]);
  });

  if (lastRequestTime && now - lastRequestTime < requestInterval) {
    console.log("Request rate limited");
    return null;
  }

  lastRequestTime = now;

  if (!filteredNetworks) return null;

  let data: Record<NetworkEnum | ExtraAssetEnum, { usd: string; }> = {} as Record<NetworkEnum | ExtraAssetEnum, { usd: string; }>;

  try {
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ filteredNetworks.join(',') }&vs_currencies=usd`;

    const responseData = await fetchData(apiUrl);

    if (responseData) {
      data = Object.keys(responseData).reduce((acc, key) => {
        // Map CoinGecko ids back to network names
        let networkKey: NetworkEnum | ExtraAssetEnum | null = null;
        switch (key) {
          case "bifrost-native-coin":
            networkKey = NetworkEnum.BIFROST;
            break;
          case "turing-network":
            networkKey = NetworkEnum.TURING;
            break;
          case "pha":
            networkKey = NetworkEnum.KHALA;
            break;
          case "zenlink-network-token":
            networkKey = ExtraAssetEnum.ZLK;
            break;
          default:
            networkKey = key as NetworkEnum;
        }
        if (networkKey) {
          acc[networkKey] = { usd: responseData[key].usd };
        }
        return acc;
      }, {} as Record<NetworkEnum | ExtraAssetEnum, { usd: string; }>);
    } else {
      console.error("Empty response data");
      return null;
    }
  } catch (error) {
    console.log("Error fetching data:", error);
    return null;
  }

  return data;
}
