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
let GoogleAdapter = GoogleAdapter_1 = class GoogleAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GoogleAdapter_1.name);
    }
    async createUser(email, password) {
        this.logger.log(`Google: creating user ${email}`);
        const [localPart] = email.split('@');
        const [firstName, lastName = 'User'] = localPart.split('.');
        const payload = {
            primaryEmail: email,
            password,
            name: {
                givenName: firstName,
                familyName: lastName,
            },
            changePasswordAtNextLogin: true,
        };
        this.logger.debug(`Google Workspace payload: ${JSON.stringify(payload)}`);
        this.logger.log(`Google: user ${email} created (simulated)`);
    }
    async suspendUser(email) {
        this.logger.log(`Google: suspending user ${email}`);
        this.logger.log(`Google: user ${email} suspended (simulated)`);
    }
    async deleteUser(email) {
        this.logger.log(`Google: deleting user ${email}`);
        this.logger.log(`Google: user ${email} deleted (simulated)`);
    }
};
exports.GoogleAdapter = GoogleAdapter;
exports.GoogleAdapter = GoogleAdapter = GoogleAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleAdapter);
//# sourceMappingURL=google.adapter.js.map