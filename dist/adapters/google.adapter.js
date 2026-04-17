"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoogleAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let GoogleAdapter = GoogleAdapter_1 = class GoogleAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GoogleAdapter_1.name);
    }
    resolveToken(credentials) {
        return credentials?.google?.accessToken ?? this.config.get('google.accessToken');
    }
    async inviteUser(email, credentials, password) {
        const accessToken = this.resolveToken(credentials);
        const [localPart] = email.split('@');
        const [firstName, lastName = 'User'] = localPart.split('.');
        this.logger.log(`Google Workspace: creating user ${email}`);
        if (!accessToken) {
            this.logger.warn(`Google Workspace: no access token available — creation of ${email} skipped (configure google.accessToken)`);
            return;
        }
        await axios_1.default.post('https://admin.googleapis.com/admin/directory/v1/users', {
            primaryEmail: email,
            password: password ?? 'ChangeMe@123!',
            name: { givenName: firstName, familyName: lastName },
            changePasswordAtNextLogin: true,
        }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
        this.logger.log(`Google Workspace: user ${email} created`);
    }
    async removeUser(email, credentials) {
        const accessToken = this.resolveToken(credentials);
        this.logger.log(`Google Workspace: suspending user ${email}`);
        if (!accessToken) {
            this.logger.warn(`Google Workspace: no access token — suspension of ${email} skipped`);
            return;
        }
        await axios_1.default.patch(`https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}`, { suspended: true }, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
        this.logger.log(`Google Workspace: user ${email} suspended`);
    }
    async assignRoleOrAccess(email, role, credentials) {
        this.logger.log(`Google Workspace: OU/group assignment for ${email} (role: ${role}) — implement via Admin SDK Groups API`);
    }
};
exports.GoogleAdapter = GoogleAdapter;
exports.GoogleAdapter = GoogleAdapter = GoogleAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleAdapter);
//# sourceMappingURL=google.adapter.js.map