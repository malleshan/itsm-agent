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
var LogsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const log_schema_1 = require("./schemas/log.schema");
let LogsService = LogsService_1 = class LogsService {
    constructor(logModel) {
        this.logModel = logModel;
        this.logger = new common_1.Logger(LogsService_1.name);
    }
    async create(dto) {
        const log = await this.logModel.create(dto);
        this.logger.log(`[${dto.action}][${dto.status}] ${dto.tool} → ${dto.email}: ${dto.message}`);
        return log;
    }
    async findByEmail(email) {
        return this.logModel.find({ email }).sort({ createdAt: -1 }).exec();
    }
    async findByEmployeeId(employeeId) {
        return this.logModel.find({ employeeId }).sort({ createdAt: -1 }).exec();
    }
    async findByTenantId(tenantId) {
        return this.logModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = LogsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(log_schema_1.Log.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LogsService);
//# sourceMappingURL=logs.service.js.map