async function getActiveMultisigs() {
    console.log("popup requesting multisigs");

    const multisigs = await browser.runtime.sendMessage("", "get_multisigs");

    console.log("popup received multisigs: ", multisigs);

    return multisigs;
}

const multisigListToHtml = (multisigs) => {
    return multisigs.map((m) => {
        return `<li>${m.name}</li>`;
    });
};

window.onload = function () {
    const mainDiv = document.getElementById("popup-content");

    getActiveMultisigs().then((multisigs) => {

        mainDiv.innerHTML = `
<ul>
${multisigListToHtml(multisigs)}
</ul >
`;

    });
};
