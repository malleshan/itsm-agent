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
var GithubAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let GithubAdapter = GithubAdapter_1 = class GithubAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GithubAdapter_1.name);
    }
    get org() {
        return this.config.get('github.org');
    }
    get headers() {
        return {
            Authorization: `Bearer ${this.config.get('github.token')}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };
    }
    async inviteUser(email) {
        this.logger.log(`GitHub: inviting ${email} to org "${this.org}"`);
        await axios_1.default.post(`https://api.github.com/orgs/${this.org}/invitations`, { email }, { headers: this.headers });
    }
    async removeUser(email) {
        const username = email.split('@')[0];
        this.logger.log(`GitHub: removing member "${username}" from org "${this.org}"`);
        await axios_1.default.delete(`https://api.github.com/orgs/${this.org}/members/${username}`, { headers: this.headers });
    }
};
exports.GithubAdapter = GithubAdapter;
exports.GithubAdapter = GithubAdapter = GithubAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GithubAdapter);
//# sourceMappingURL=github.adapter.js.map