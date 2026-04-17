"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCompanyEmail = generateCompanyEmail;
function generateCompanyEmail(name, domain = 'terralogic.com') {
    const parts = name.trim().toLowerCase().split(/\s+/);
    const localPart = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0];
    return `${localPart}@${domain}`;
}
//# sourceMappingURL=helpers.js.map