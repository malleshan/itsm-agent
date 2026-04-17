"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = generatePassword;
const crypto_1 = require("crypto");
function generatePassword() {
    return crypto_1.default.randomBytes(6).toString('hex');
}
//# sourceMappingURL=password.js.map