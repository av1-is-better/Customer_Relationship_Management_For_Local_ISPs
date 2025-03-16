const CryptoJS = require('crypto-js');

// Generate a random key using CryptoJS
const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
console.log("Generated Key:", key);