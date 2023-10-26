import * as Kilt from '@kiltprotocol/sdk-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { encodeAddress } from '@polkadot/util-crypto';

import { useRingApisContext } from "../providers/ringApisProvider";
import { WSS_TINKERNET } from './consts';

export enum ImageType {
  URL,
  RMRK,
};

export class IdentityImage {
  private temp: string;
  value: string;
  type: ImageType;

  constructor(value: any, type: ImageType) {
    this.type = type;

    switch (type) {
      case ImageType.URL:
        this.temp = "";
        this.value = value;
        break;

      case ImageType.RMRK:
        const { address, md5 } = value;
        const kusamaAddress = encodeAddress(address, 2);

        const url = `https://singular.app/api/get-identity-images?userId=${ kusamaAddress }&nftMd5Id=${ md5 }&_vercel_no_cache=1`;

        this.temp = url;
        this.value = "";
        break;
    }
  }

  public async set() {
    switch (this.type) {
      case ImageType.URL:
        break;

      case ImageType.RMRK:
        const response = await fetch(this.temp);
        const jsonData = await response.json();

        this.value = jsonData.primaryResourceData.metadata.mediaUri;
        this.temp = "";
    }
  }
};

export enum IdentityServices {
  Web3Name = "Web3Name",
  TinkernetIdentity = "Tinkernet",
  KusamaIdentity = "Kusama",
  PolkadotIdentity = "Polkadot",
};

export type Identity = {
  service: IdentityServices;
  address: string;
  name: string;
  legal?: string;
  image?: IdentityImage;
  twitter?: string;
  discord?: string;
  telegram?: string;
  web?: string;
};

export type AggregatedIdentity = {
  address: string;
  name?: string;
  legal?: string;
  image?: IdentityImage;
  twitter?: string;
  discord?: string;
  telegram?: string;
  web?: string;
  otherIdentities: Identity[];
};

export async function getBestIdentity(address: string): Promise<AggregatedIdentity> {
  console.log("trying to get best identity for: ", address);

  const ringApisContext = useRingApisContext();

  const web3NamePromise = getWeb3Name(address);
  const tinkernetIdentityPromise = getTinkernetIdentity(address, ringApisContext?.state.tinkernet);
  const kusamaIdentityPromise = getKusamaIdentity(address);
  const polkadotIdentityPromise = getPolkadotIdentity(address);

  const [
    web3Name,
    tinkernetIdentity,
    kusamaIdentity,
    polkadotIdentity
  ] = await Promise.all([
    web3NamePromise,
    tinkernetIdentityPromise,
    kusamaIdentityPromise,
    polkadotIdentityPromise
  ]);

  const otherIdentities: Identity[] = [
    web3Name,
    tinkernetIdentity,
    kusamaIdentity,
    polkadotIdentity
  ].filter((i): i is Identity => !!i);

  return {
    address,
    otherIdentities,

    name: web3Name?.name || tinkernetIdentity?.name || polkadotIdentity?.name || kusamaIdentity?.name,
    legal: tinkernetIdentity?.legal || polkadotIdentity?.legal || kusamaIdentity?.legal,
    image: tinkernetIdentity?.image || polkadotIdentity?.image || kusamaIdentity?.image,
    twitter: tinkernetIdentity?.twitter || polkadotIdentity?.twitter || kusamaIdentity?.twitter,
    discord: tinkernetIdentity?.discord || polkadotIdentity?.discord || kusamaIdentity?.discord,
    telegram: tinkernetIdentity?.telegram || polkadotIdentity?.telegram || kusamaIdentity?.telegram,
    web: tinkernetIdentity?.web || polkadotIdentity?.web || kusamaIdentity?.web,
  };
}

async function getWeb3Name(address: string): Promise<Identity | undefined> {
  await Kilt.connect('wss://spiritnet.kilt.io/');

  const api = Kilt.ConfigService.get('api');


  try {
    const { web3Name } = Kilt.Did.linkedInfoFromChain(
      await api.call.did.queryByAccount(
        Kilt.Did.accountToChain(address)
      )
    );

    if (web3Name) {
      Kilt.disconnect();

      return {
        address,
        name: `w3n:${ web3Name }`,
        service: IdentityServices.Web3Name,
      };
    } else {
      Kilt.disconnect();

      return;
    }
  } catch {
    Kilt.disconnect();

    return;
  }
}

async function getKusamaIdentity(address: string): Promise<Identity | undefined> {
  const kusamaApi = await ApiPromise.create({ provider: new WsProvider("wss://kusama-rpc.dwellir.com") });

  const iden = (
    (await kusamaApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  let image;

  if (iden?.image?.Raw) image = new IdentityImage(iden.image.Raw, ImageType.URL);
  else {
    const maybeRmrkImage = iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "userpic")?.[1].Raw;
    if (maybeRmrkImage) {
      image = new IdentityImage({ md5: maybeRmrkImage, address }, ImageType.RMRK);
      await image.set();
    }
  }

  kusamaApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.KusamaIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}

async function getPolkadotIdentity(address: string): Promise<Identity | undefined> {
  const polkadotApi = await ApiPromise.create({ provider: new WsProvider("wss://polkadot-rpc.dwellir.com") });

  const iden = (
    (await polkadotApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw, ImageType.URL) : undefined;

  polkadotApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.PolkadotIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}

async function getTinkernetIdentity(address: string, ringApi?: ApiPromise): Promise<Identity | undefined> {
  const tinkernetApi = ringApi || await ApiPromise.create({ provider: new WsProvider(WSS_TINKERNET) });

  const iden = (
    (await tinkernetApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw, ImageType.URL) : undefined;

  if (!ringApi) tinkernetApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.TinkernetIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}
