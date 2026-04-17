"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBaseEmail = generateBaseEmail;
function generateBaseEmail(firstName, lastName, domain = 'terralogic.com') {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}
//# sourceMappingURL=helpers.js.map