import { createEffect, createSignal, onMount } from "solid-js";
import { AssetEnum } from "../data/rings";
import { NetworkEnum } from "./consts";

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

export function getCurrentUsdPrice(network: NetworkEnum) {
  if (network !== NetworkEnum.BASILISK) return null;

  let data;

  try {
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${ network }?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    const responseData = fetchData(apiUrl);
    if (responseData) {
      data = responseData;
    } else {
      // Handle the case when the API response is null or empty
      console.error("Empty response data");
      return null;
    }
  } catch (error) {
    // Handle any errors that occur during the API request
    console.error("Error fetching data:", error);
    return null;
  };

  return data;
}