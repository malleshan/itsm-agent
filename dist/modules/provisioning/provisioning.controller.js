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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProvisioningController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const provisioning_service_1 = require("./provisioning.service");
let ProvisioningController = ProvisioningController_1 = class ProvisioningController {
    constructor(provisioningService) {
        this.provisioningService = provisioningService;
        this.logger = new common_1.Logger(ProvisioningController_1.name);
    }
    async handleEmployeeOnboarded(message, context) {
        const event = this.parsePayload(message);
        this.logger.log(`[Kafka] itsm.employee.onboarded → ${event.email}`);
        await this.provisioningService.provisionEmployee(event);
        const { offset } = context.getMessage();
        const partition = context.getPartition();
        const topic = context.getTopic();
        this.logger.debug(`Committed offset ${offset} on ${topic}[${partition}]`);
    }
    async handleEmployeeOffboarded(message, context) {
        const event = this.parsePayload(message);
        this.logger.log(`[Kafka] itsm.employee.offboarded → ${event.email}`);
        await this.provisioningService.deprovisionEmployee(event);
    }
    parsePayload(message) {
        if (typeof message === 'string') {
            return JSON.parse(message);
        }
        if (message?.value && typeof message.value === 'string') {
            return JSON.parse(message.value);
        }
        return message;
    }
};
exports.ProvisioningController = ProvisioningController;
__decorate([
    (0, microservices_1.EventPattern)('itsm.employee.onboarded'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.KafkaContext]),
    __metadata("design:returntype", Promise)
], ProvisioningController.prototype, "handleEmployeeOnboarded", null);
__decorate([
    (0, microservices_1.EventPattern)('itsm.employee.offboarded'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.KafkaContext]),
    __metadata("design:returntype", Promise)
], ProvisioningController.prototype, "handleEmployeeOffboarded", null);
exports.ProvisioningController = ProvisioningController = ProvisioningController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [provisioning_service_1.ProvisioningService])
], ProvisioningController);
//# sourceMappingURL=provisioning.controller.js.map