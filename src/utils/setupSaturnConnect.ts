import { BN } from '@polkadot/util';

import { Rings } from "../data/rings";
import { type SaturnContextType } from "../providers/saturnProvider";
import { type OpenProposeModalType } from "../providers/proposeProvider";

declare global {
    interface Window { sendMultisigData: (multisigData: { name: string; address: string }) => void }
}

export function setupSaturnConnect(saturnContext: SaturnContextType, openProposeModal: OpenProposeModalType) {
    window.addEventListener('message', ({ data, source }) => {

        if (data.type === "IN_GATEWAY" && data.text === "sign_payload") {
            console.log("received payload to propose: ", data.payload);

            if (!saturnContext.state.saturn || !saturnContext.state.multisigId) return;

            if (data.payload.genesisHash === Rings.tinkernet.genesisHash) { } else {
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

                openProposeModal(proposal);
            }

        }
    });
}

export function setSaturnConnectAccount(name: string, address: string) {
    window.sendMultisigData({ name, address });
}
