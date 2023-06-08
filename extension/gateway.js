function sendMessage(message) {
    return new Promise((resolve, reject) => {
        handlers[message.text] = { reject, resolve };

        window.postMessage(message, "*");
    });
}

function inject() {
    console.log("injecting gateway code...");

        window.sendMultisigData = () => {
            sendMultisigData();
        };

    console.log("injected gateway code");
}

inject();

function sendMultisigData() {
    console.log("sendMultisigData called with thisMultisigData being: ", window.thisMultisigData);
    if (window.thisMultisigData) {
        const multisigData = window.thisMultisigData;

        window.postMessage({ type: "FROM_GATEWAY", text: "multisig_data", multisigData }, "*");

        console.log("gateway posted message to gateway_content with multisigData");
    } else {
        console.log("window.thisMultisigData not initialized");
    }

    }

window.addEventListener('message', ({ data, source }) => {

    if (data.type === "FROM_CONTENT_TO_GATEWAY" && data.text === "sign_payload") {
        console.log("page is asking to sign a payload: ", data.payload);

        window.postMessage({ type: "IN_GATEWAY", text: "sign_payload", payload: data.payload }, "*");
    }
});

//sendMultisigData();
