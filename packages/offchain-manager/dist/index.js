"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const client = (0, client_1.createOffchainManagerClient)({
    baseURL: "http://localhost:3000"
});
const apiKey = "testing123";
client.setApiKey("test.eth", apiKey);
const test = async () => {
    client.setApiKey("testing1.eth", apiKey);
    const response = await client.createSubname({
        address: "0x1D84ad46F1ec91b4Bb3208F645aD2fA7aBEc19f8",
        domain: "testing1.eth",
        label: "test",
        addresses: {},
    });
    console.log(response);
};
test();
