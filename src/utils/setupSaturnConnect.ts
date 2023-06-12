import { BN, hexToU8a } from '@polkadot/util';

import { Rings } from "../data/rings";
import { type SaturnContextType } from "../providers/saturnProvider";
import { type ProposeContextType } from "../providers/proposeProvider";

declare global {
    interface Window {
        saturnConnect: {
            sendMultisigData: (multisigData: { name: string; address: string }) => void;
        }
    }
}

export function setupSaturnConnect(saturnContext: SaturnContextType, proposeContext: ProposeContextType) {
    window.addEventListener('message', ({ data, source }) => {

        if (data.type === "IN_GATEWAY" && data.text === "sign_payload") {
            console.log("received payload to propose: ", data.payload);

            if (!saturnContext.state.saturn || !saturnContext.state.multisigId) return;

            if (data.payload.genesisHash === Rings.tinkernet.genesisHash) {
                proposeContext.setters.openProposeModal(hexToU8a(data.payload.method), false);
            } else {
                const chain = Object.entries(Rings).find(([chain, ringData]) => ringData.genesisHash === data.payload.genesisHash)?.[0];

                if (!chain) return;

                const xcmFeeAsset = saturnContext.state.saturn.chains.find((c) => c.chain.toLowerCase() == chain)?.assets[0].registerType;

                if (!xcmFeeAsset) return;

                const proposal = saturnContext.state.saturn.sendXCMCall({
                    id: saturnContext.state.multisigId,
                    destination: chain,
                    weight: new BN("5000000000"), // TODO
                    xcmFeeAsset, // TODO
                    xcmFee: new BN("50000000000000"), // TODO
                    callData: data.payload.method,
                });

                proposeContext.setters.openProposeModal(proposal, true);
            }

        }
    });
}

export function setSaturnConnectAccount(name: string, address: string) {
    window.saturnConnect.sendMultisigData({ name, address });
}
