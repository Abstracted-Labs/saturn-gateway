import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const multisigs = {};

browser.runtime.onMessage.addListener(
    async (data, sender, sendResponse) => {
        console.log("message in saturn-connect: ", data);

        if (data.text === 'multisig_data') {
            console.log("background script received multisig_data: ", data.multisigData);

            const tabId = sender.tab.id;


            multisigs[data.multisigData.address] = { ...data.multisigData, tabId };
        }

        if (data === 'get_multisigs') {
            console.log("background script received get_multisigs");

            const m = Object.values(multisigs);

            sendResponse(m);

            return Promise.resolve(m);
        }

        if (data.text === 'sign_payload') {
            console.log("background script received sign_payload: ", data.payload);

           const targetMultisig = Object.values(multisigs).find((m) => u8aToHex(decodeAddress(m.address)) == u8aToHex(decodeAddress(data.payload.address)));

            console.log("message targeted to tab: ", targetMultisig.tabId);

            browser.tabs.sendMessage(targetMultisig.tabId, { type: "FROM_BACKGROUND_TO_GATEWAY", text: "sign_payload", payload: data.payload });
        }

        return false;
    }
);
