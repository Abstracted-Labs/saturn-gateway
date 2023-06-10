async function getActiveMultisigs() {
    console.log("popup requesting multisigs");

    const multisigs = await browser.runtime.sendMessage("", "popup_get_multisigs");

    console.log("popup received multisigs: ", multisigs);

    return multisigs;
}

async function isCurrentPageEnabled() {
    const url = (await browser.tabs.query({ currentWindow: true, active: true }))[0].url;

    //const enabled = await browser.runtime.sendMessage("", { text: "is_current_page_enabled", url });

    const hostname = new URL(url).hostname;

    const enabled = (await browser.storage.local.get(hostname))[hostname];

    console.log("enabled: ", enabled);

    return enabled || false;
}

async function setCurrentPageEnabled(enabled) {
    const url = (await browser.tabs.query({ currentWindow: true, active: true }))[0].url;

    const hostname = new URL(url).hostname;

    if (enabled) {
        await browser.storage.local.set({ [hostname]: true });
    } else {
        await browser.storage.local.remove(hostname);
    }

    // await browser.runtime.sendMessage("", { text: "set_current_page_enabled", url, enabled });
}

async function getHostname() {
    const url = (await browser.tabs.query({ currentWindow: true, active: true }))[0].url;

    return new URL(url).hostname;
}

const multisigListToHtml = (multisigs) => {
    return multisigs.map((m) => {
        return `<li>${m.name}</li>`;
    });
};

browser.runtime.onMessage.addListener((data) => {
    console.log("Message from the background script:", data);

    if (data.type === "EXTENSION" && data.text === "page_asking_permission") {
        console.log("page_asking_permission");

        window.postMessage({ type: "FROM_CONTENT_TO_GATEWAY", text: "sign_payload", payload: data.payload }, "*");
    }

    return false;
});

window.onload = function () {
    const hostnameSpan = document.getElementById("hostname-span");

    getHostname().then((hostname) => hostnameSpan.innerText = hostname);

    const enabledSwitch = document.getElementById("enabled-switch");

    isCurrentPageEnabled().then((enabled) => enabledSwitch.checked = enabled);

    enabledSwitch.addEventListener('change', () => {
        if (enabledSwitch.checked) {
            setCurrentPageEnabled(true);
        } else {
            setCurrentPageEnabled(false);
        }
    });

    const mainDiv = document.getElementById("multisig-list");

    getActiveMultisigs().then((multisigs) => {

        mainDiv.innerHTML = `
<ul>
${multisigListToHtml(multisigs)}
</ul >
`;

    });
};
