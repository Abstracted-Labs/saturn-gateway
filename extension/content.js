import { chrome } from '@polkadot/extension-inject/chrome';

// connect to the extension
const port = chrome.runtime.connect();

// send any messages from the extension back to the page
port.onMessage.addListener((data) => {
    window.postMessage({ ...data, origin: "MESSAGE_ORIGIN_CONTENT" }, '*');
});

// all messages from the page, pass them to the extension
window.addEventListener('message', ({ data, source }) => {

    if (data.type === "FROM_PAGE" && data.text === "get_multisigs") {
        console.log("injected script is asking for multisigs");

        browser.runtime.sendMessage("", "get_multisigs").then((multisigs) => {
            console.log("content got multisigs: ", multisigs);

            window.postMessage({ type: "TO_PAGE", text: "multisigs", multisigs }, "*");

            console.log("content sent multisigs to inject");
        });
    }

    if (data.type === "FROM_GATEWAY" && data.text === "multisig_data") {
        console.log("gateway_content received multisig_data: ", data.multisigData);

        browser.runtime.sendMessage("", { type: "FROM_CONTENT", text: "multisig_data", multisigData: data.multisigData });
    }

    if (data.type === "FROM_PAGE_TO_GATEWAY" && data.text === "sign_payload") {
        console.log("injected script is asking for multisigs");

        browser.runtime.sendMessage("", { type: "FROM_PAGE_TO_GATEWAY", text: "sign_payload", payload: data.payload });
    }

    // only allow messages from our window, by the inject
    if (source !== window || data.origin !== "MESSAGE_ORIGIN_PAGE") {
        return;
    }

    port.postMessage(data);
});

browser.runtime.onMessage.addListener((data) => {
    console.log("Message from the background script:", data);

    if (data.type === "FROM_BACKGROUND_TO_GATEWAY" && data.text === "sign_payload") {
        console.log("background script is sending payload to gateway");

        window.postMessage({ type: "FROM_CONTENT_TO_GATEWAY", text: "sign_payload", payload: data.payload }, "*");
    }

    return false;
});

const script = document.createElement('script');

if (document.getElementById("isSaturnGateway")) {
    console.log("page is Saturn Gateway");

    script.src = chrome.extension.getURL('../gateway/index.js');
} else {
    script.src = chrome.extension.getURL('../inject/index.js');
}

script.onload = () => {
    if (script.parentNode) {
        script.parentNode.removeChild(script);
    }
};

(document.head || document.documentElement).appendChild(script);
