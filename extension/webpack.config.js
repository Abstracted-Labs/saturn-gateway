const path = require("path");

module.exports = {
    entry: {
        background: "./background.js",
        content: "./content.js",
        inject: "./inject.js",
        gateway: "./gateway.js",
        popup: "./popup.js"
    },
    output: {
        path: path.resolve(__dirname, "addon"),
        filename: "[name]/index.js"
    },
    mode: 'none',
};
