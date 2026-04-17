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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogSchema = exports.Log = exports.LogAction = exports.LogStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var LogStatus;
(function (LogStatus) {
    LogStatus["SUCCESS"] = "SUCCESS";
    LogStatus["FAILED"] = "FAILED";
})(LogStatus || (exports.LogStatus = LogStatus = {}));
var LogAction;
(function (LogAction) {
    LogAction["PROVISION"] = "PROVISION";
    LogAction["DEPROVISION"] = "DEPROVISION";
})(LogAction || (exports.LogAction = LogAction = {}));
let Log = class Log {
};
exports.Log = Log;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Log.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Log.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Log.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Log.prototype, "tool", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(LogAction) }),
    __metadata("design:type", String)
], Log.prototype, "action", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: Object.values(LogStatus) }),
    __metadata("design:type", String)
], Log.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Log.prototype, "message", void 0);
exports.Log = Log = __decorate([
    (0, mongoose_1.Schema)({ collection: 'itsm_provisioning_logs', timestamps: true })
], Log);
exports.LogSchema = mongoose_1.SchemaFactory.createForClass(Log);
exports.LogSchema.index({ tenantId: 1, employeeId: 1 });
exports.LogSchema.index({ tenantId: 1, email: 1 });
//# sourceMappingURL=log.schema.js.map