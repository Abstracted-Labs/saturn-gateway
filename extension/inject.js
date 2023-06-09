import { injectExtension } from '@polkadot/extension-inject';

const handlers = {};
let metadata = {};
let usingSC = false;

function sendMessage(message) {
    return new Promise((resolve, reject) => {
        handlers[message.text] = { reject, resolve };

        window.postMessage(message, "*");
    });
}

    const enablePJS = async () => {
        console.log("enablePJS called");

        const injectedAccounts = {
            get: async (anyType) => {
                if (usingSC) {
                    console.log("dapp asked for PJS accounts but SC is aready enabled.");

                    if (window.injectedWeb3["polkadot-js"].version === "saturn-connect-0.0.1") {
                        delete window.injectedWeb3["polkadot-js"];
                    }

                    return Promise.resolve([]);
                } else {
                    return sendMessage({ type: "FROM_PAGE", text: "get_multisigs" });
                }
            },

            subscribe: (cb) => {
                return () => {};
            }
        };

        const injectedSigner = {
            signPayload: async (payload) => {

                if (usingSC) {
                    console.log("dapp asked for PJS signer but SC is aready enabled.");

                    if (window.injectedWeb3["polkadot-js"].version === "saturn-connect-0.0.1") {
                        delete window.injectedWeb3["polkadot-js"];
                    }

                    return Promise.resolve({});
                } else {
                    console.log("signPayload payload: ", payload);

                    sendMessage({ type: "FROM_PAGE_TO_GATEWAY", text: "sign_payload", payload });

                    return Promise.resolve({ error: 69420, message: "Proposed to multisig." });
                }
            },
        };

        const injectedMetadata = {
            get: async () => {
                if (usingSC) {
                    console.log("dapp asked for PJS metadata but SC is aready enabled.");

                    if (window.injectedWeb3["polkadot-js"].version === "saturn-connect-0.0.1") {
                        delete window.injectedWeb3["polkadot-js"];
                    }

                    return Promise.resolve([]);
                } else {

                    console.log("dapp requesting metadata list: ", metadata);

                    return Promise.resolve(Object.values(metadata));
                }
            },

            provide: async (m) => {
                if (usingSC) {
                    console.log("dapp asked for PJS metadata but SC is aready enabled.");

                    if (window.injectedWeb3["polkadot-js"].version === "saturn-connect-0.0.1") {
                        delete window.injectedWeb3["polkadot-js"];
                    }

                    return Promise.resolve(false);
                } else {

                    console.log("dapp providing metadata: ", m);

                    metadata[m.genesisHash] = m;

                    return Promise.resolve(true);
                }
            }
        };

        const injected = {
            accounts: injectedAccounts,
            signer: injectedSigner,
            metadata: injectedMetadata,
        };

        return Promise.resolve(injected);
    };

    const enableSC = async () => {
        console.log("enableSC called");

        usingSC = true;

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

                console.log("dapp requesting metadata list: ", metadata);

                return Promise.resolve(Object.values(metadata));
            },

            provide: async (m) => {

                console.log("dapp providing metadata: ", m);

                metadata[m.genesisHash] = m;

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
    injectExtension(enableSC, { name: 'Saturn Connect', version: "0.0.1" });
    injectExtension(enablePJS, { name: 'polkadot-js', version: "saturn-connect-0.0.1" });

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
