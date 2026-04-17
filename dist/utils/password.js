"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = generatePassword;
const crypto = require("crypto");
function generatePassword() {
    return crypto.randomBytes(6).toString('hex');
}
//# sourceMappingURL=password.js.map