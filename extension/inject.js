import { injectExtension } from '@polkadot/extension-inject';

const handlers = {};
let metadata = {};

const nothing = async () => {};

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        handlers[message.text] = { reject, resolve };

        window.postMessage(message, "*");
    });
}

    const enable = async () => {
        console.log("enable called");

        const injectedAccounts = {
            get: async (anyType) => {
                return sendMessage({ type: "FROM_PAGE", text: "get_multisigs" });
            },

            subscribe: (cb) => {
                return () => {};
            }
        };

        const injectedSigner = {
            signPayload: async (payload) => {

                console.log("signPayload payload: ", payload);

                sendMessage({ type: "FROM_PAGE_TO_GATEWAY", text: "sign_payload", payload });

                return Promise.resolve({ error: 69420, message: "Proposed to multisig." });
            },
        };

        const injectedMetadata = {
            get: async () => {

                console.log("get metadata: ", metadata);

                return Promise.resolve({ genesisHash: metadata.genesisHash, specVersion: metadata.specVersion });
            },

            provide: async (m) => {

                console.log("provide metadata: ", m);

                metadata = m;

                return Promise.resolve(true);
            }
        };

        const injected = {
            accounts: injectedAccounts,
            signer: injectedSigner,
            metadata: injectedMetadata,
        };

        return Promise.resolve(injected);
    };

function inject() {
    injectExtension(enable, { name: 'polkadot-js', version: "0.0.1" });

    console.log("injected");
}

window.addEventListener('message', ({ data, source }) => {

    if (data.type === "TO_PAGE" && data.text === "multisigs") {
        const multisigs = data.multisigs;

        console.log("multisigs received: ", multisigs);

        handlers["get_multisigs"].resolve(multisigs);
    }

    if (data.type === "FROM_GATEWAY" && data.text === "multisigs") {
        const multisigs = data.multisigs;

        console.log("multisigs received: ", multisigs);

        handlers["get_multisigs"].resolve(multisigs);
    }

    // only allow messages from our window, by the loader
    if (source !== window || data.origin !== "MESSAGE_ORIGIN_CONTENT") {
        return;
    }

    if (data.id) {
        console.log("message handler: ", data);
    } else {
        console.error('Missing id for response.');
    }
});

inject();
