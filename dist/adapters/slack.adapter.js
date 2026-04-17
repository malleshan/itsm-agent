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
var SlackAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let SlackAdapter = SlackAdapter_1 = class SlackAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(SlackAdapter_1.name);
    }
    token(c) {
        return c?.slack?.botToken ?? this.config.get('slack.botToken');
    }
    headers(c) {
        return {
            Authorization: `Bearer ${this.token(c)}`,
            'Content-Type': 'application/json',
        };
    }
    async inviteUser(email, credentials) {
        this.logger.log(`Slack: inviting ${email}`);
        const res = await axios_1.default.post('https://slack.com/api/users.admin.invite', { email }, { headers: this.headers(credentials) });
        if (!res.data?.ok) {
            throw new Error(`Slack invite failed: ${res.data?.error ?? 'unknown'}`);
        }
    }
    async removeUser(email, credentials) {
        this.logger.log(`Slack: deactivating ${email}`);
        const headers = this.headers(credentials);
        const lookupRes = await axios_1.default.get(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, { headers });
        if (!lookupRes.data?.ok) {
            throw new Error(`Slack lookup failed: ${lookupRes.data?.error}`);
        }
        const userId = lookupRes.data.user.id;
        const deactivateRes = await axios_1.default.post('https://slack.com/api/users.admin.setInactive', { user: userId }, { headers });
        if (!deactivateRes.data?.ok) {
            throw new Error(`Slack deactivation failed: ${deactivateRes.data?.error}`);
        }
    }
    async assignRoleOrAccess(email, role, _credentials) {
        this.logger.log(`Slack: channel membership assignment for ${email} (role: ${role})`);
    }
};
exports.SlackAdapter = SlackAdapter;
exports.SlackAdapter = SlackAdapter = SlackAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SlackAdapter);
//# sourceMappingURL=slack.adapter.js.map