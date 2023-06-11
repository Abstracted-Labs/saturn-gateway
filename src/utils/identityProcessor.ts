import * as Kilt from '@kiltprotocol/sdk-js'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { Option } from '@polkadot/types';

export enum ImageType {
    URL
};

export class IdentityImage {
    value: string;
    type: ImageType;

    constructor(value: string) {
        this.value = value;
        this.type = ImageType.URL;
    }
};

export enum IdentityServices {
    Web3Name,
    TinkernetIdentity,
    KusamaIdentity,
    PolkadotIdentity,
    ENS,
    SubsocialUsername,
};

export type Identity = {
    service: IdentityServices;
    address: string;
    name?: string;
    image?: IdentityImage;
    twitter?: string;
    web?: string;
};

export type AggregatedIdentity = {
    address: string;
    name?: string;
    image?: IdentityImage;
    twitter?: string;
    web?: string;
    otherIdentities: Identity[];
};

export async function getBestIdentity(address: string): Promise<AggregatedIdentity> {
    const otherIdentities = [];

    const web3Name = await getWeb3Name(address);
    otherIdentities.push(web3Name);

    const kusamaIdentity = await getKusamaIdentity(address);
    otherIdentities.push(kusamaIdentity);

    const polkadotIdentity = await getPolkadotIdentity(address);
    otherIdentities.push(polkadotIdentity);

    const tinkernetIdentity = await getTinkernetIdentity(address);
    otherIdentities.push(tinkernetIdentity);

    return {
        address,
        name: web3Name.name || tinkernetIdentity.name || kusamaIdentity.name || polkadotIdentity.name,
        image: tinkernetIdentity.image || kusamaIdentity.image || polkadotIdentity.image,
        twitter: tinkernetIdentity.twitter || kusamaIdentity.twitter || polkadotIdentity.twitter,
        web: tinkernetIdentity.web || kusamaIdentity.web || polkadotIdentity.web,
        otherIdentities: otherIdentities,
    }
}

async function getWeb3Name(address: string): Promise<Identity> {
    await Kilt.connect('wss://spiritnet.kilt.io/')

    const api = Kilt.ConfigService.get('api');


    try {
        const { web3Name } = Kilt.Did.linkedInfoFromChain(
            await api.call.did.queryByAccount(
                Kilt.Did.accountToChain(address)
            )
        );

        if (web3Name) {
            console.log(`web3name for account "${address}" -> "${web3Name}"`);

            return {
                address,
                name: `w3n:${web3Name}`,
                service: IdentityServices.Web3Name,
            };
        } else {
            console.log(`Account "${address}" does not have a linked web3name.`);

            return {
                address,
                service: IdentityServices.Web3Name,
            };
        }
    } catch {
        return {
            address,
            service: IdentityServices.Web3Name,
        };
    }
}

async function getKusamaIdentity(address: string): Promise<Identity> {
    const kusamaApi = await ApiPromise.create({ provider: new WsProvider("wss://kusama.api.onfinality.io/public-ws") });

    const iden = (
        (await kusamaApi.query.identity.identityOf(address))?.toHuman() as {
            info: {
                display: { Raw: string };
                image: { Raw: string };
                twitter: { Raw: string };
                web: { Raw: string };
            };
        }
    )?.info;

    const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw) : undefined;

    return {
        service: IdentityServices.KusamaIdentity,
        address,
        name: iden?.display?.Raw,
        image,
        twitter: iden?.twitter?.Raw,
        web: iden?.web?.Raw,
    };
}

async function getPolkadotIdentity(address: string): Promise<Identity> {
    const polkadotApi = await ApiPromise.create({ provider: new WsProvider("wss://polkadot.api.onfinality.io/public-ws") });

    const iden = (
        (await polkadotApi.query.identity.identityOf(address))?.toHuman() as {
            info: {
                display: { Raw: string };
                image: { Raw: string };
                twitter: { Raw: string };
                web: { Raw: string };
            };
        }
    )?.info;

    const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw) : undefined;

    return {
        service: IdentityServices.KusamaIdentity,
        address,
        name: iden?.display?.Raw,
        image,
        twitter: iden?.twitter?.Raw,
        web: iden?.web?.Raw,
    };
}

async function getTinkernetIdentity(address: string): Promise<Identity> {
    const tinkernetApi = await ApiPromise.create({ provider: new WsProvider("wss://invarch-tinkernet.api.onfinality.io/public-ws") });

    const iden = (
        (await tinkernetApi.query.identity.identityOf(address))?.toHuman() as {
            info: {
                display: { Raw: string };
                image: { Raw: string };
                twitter: { Raw: string };
                web: { Raw: string };
            };
        }
    )?.info;

    const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw) : undefined;

    return {
        service: IdentityServices.KusamaIdentity,
        address,
        name: iden?.display?.Raw,
        image,
        twitter: iden?.twitter?.Raw,
        web: iden?.web?.Raw,
    };
}
