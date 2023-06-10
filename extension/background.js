import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const multisigs = {};
let enabledPages = {};

browser.storage.local.get().then((pages) => {
    console.log("pages in storage: ", pages);
    enabledPages = pages;
});

browser.storage.local.onChanged.addListener((changes) => {
    const changedItems = Object.keys(changes);

    for (const item of changedItems) {
        if (changes[item].newValue) {
            enabledPages[item] = true;
        } else {
            delete enabledPages[item];
        }
    }
});

browser.runtime.onMessage.addListener(
    async (data, sender, sendResponse) => {
        console.log("message in saturn-connect: ", data);

        if (data.text === 'multisig_data') {
            console.log("background script received multisig_data: ", data.multisigData);

            const tabId = sender.tab.id;


            multisigs[tabId] = { ...data.multisigData, tabId };
        }

        if (data === 'popup_get_multisigs') {
            console.log("background script received popup_get_multisigs");

            const m = Object.values(multisigs);

            sendResponse(m);

            return Promise.resolve(m);
        }

        if (data.text === 'get_multisigs') {
            console.log("background script received get_multisigs from hostname: ", data.hostname);

            console.log("page enabled: ", enabledPages[data.hostname]);

            const hostname = data.hostname;

            const m = enabledPages[hostname] ? Object.values(multisigs) : [];

            sendResponse(m);

            return Promise.resolve(m);
        }

        if (data.text === 'sign_payload') {
            console.log("background script received sign_payload: ", data.payload);

            const hostname = data.hostname;

            if (enabledPages[hostname]) {
                const targetMultisig = Object.values(multisigs).find((m) => u8aToHex(decodeAddress(m.address)) == u8aToHex(decodeAddress(data.payload.address)));

                console.log("message targeted to tab: ", targetMultisig.tabId);

                browser.tabs.sendMessage(targetMultisig.tabId, { type: "FROM_BACKGROUND_TO_GATEWAY", text: "sign_payload", payload: data.payload });
            }
        }

        return false;
    }
);

browser.tabs.onRemoved.addListener((tabId) => delete multisigs[tabId]);
