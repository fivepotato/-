const { encrypt } = require("./crypt");

const c = encrypt(process.argv[2]);
console.log(JSON.stringify(c));