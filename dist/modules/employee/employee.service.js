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
var EmployeeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const employee_schema_1 = require("./schemas/employee.schema");
const kafka_producer_service_1 = require("../../kafka/kafka.producer.service");
const provisioning_service_1 = require("../provisioning/provisioning.service");
const helpers_1 = require("../../utils/helpers");
let EmployeeService = EmployeeService_1 = class EmployeeService {
    constructor(employeeModel, kafkaProducer, provisioningService, config) {
        this.employeeModel = employeeModel;
        this.kafkaProducer = kafkaProducer;
        this.provisioningService = provisioningService;
        this.config = config;
        this.logger = new common_1.Logger(EmployeeService_1.name);
    }
    async create(dto) {
        const domain = this.config.get('company.emailDomain') || 'terralogic.com';
        const email = await this.generateUniqueEmail(dto.firstName, dto.lastName, domain);
        const employee = await this.employeeModel.create({
            ...dto,
            name: `${dto.firstName} ${dto.lastName}`,
            email,
        });
        this.logger.log(`Employee created: ${employee.email} (id: ${employee._id})`);
        const event = {
            employeeId: String(employee._id),
            tenantId: employee.tenantId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            role: employee.role,
            department: employee.department,
        };
        const kafkaEnabled = this.config.get('kafka.enabled') !== 'false' &&
            process.env.KAFKA_ENABLED !== 'false';
        if (kafkaEnabled) {
            await this.kafkaProducer.publishOnboarded(event);
        }
        else {
            this.logger.log(`Kafka disabled — triggering provisioning directly for ${email}`);
            this.provisioningService.provisionEmployee(event).catch((err) => this.logger.error(`Direct provisioning failed for ${email}: ${err.message}`));
        }
        return employee;
    }
    async findAll() {
        return this.employeeModel.find().exec();
    }
    async findById(id) {
        const employee = await this.employeeModel.findById(id).exec();
        if (!employee)
            throw new common_1.NotFoundException(`Employee ${id} not found`);
        return employee;
    }
    async offboard(id) {
        const employee = await this.findById(id);
        employee.status = employee_schema_1.EmployeeStatus.OFFBOARDED;
        await employee.save();
        this.logger.log(`Employee offboarded: ${employee.email}`);
        const event = {
            employeeId: String(employee._id),
            tenantId: employee.tenantId,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            role: employee.role,
            department: employee.department,
        };
        const kafkaEnabled = process.env.KAFKA_ENABLED !== 'false';
        if (kafkaEnabled) {
            await this.kafkaProducer.publishOffboarded(event);
        }
        else {
            this.logger.log(`Kafka disabled — triggering de-provisioning directly for ${employee.email}`);
            this.provisioningService.deprovisionEmployee(event).catch((err) => this.logger.error(`Direct de-provisioning failed for ${employee.email}: ${err.message}`));
        }
        return employee;
    }
    async generateUniqueEmail(firstName, lastName, domain) {
        const base = (0, helpers_1.generateBaseEmail)(firstName, lastName, domain);
        const baseExists = await this.employeeModel.exists({ email: base });
        if (!baseExists)
            return base;
        for (let i = 0; i < 10; i++) {
            const suffix = Math.floor(100 + Math.random() * 900);
            const candidate = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${domain}`;
            const exists = await this.employeeModel.exists({ email: candidate });
            if (!exists)
                return candidate;
        }
        throw new common_1.ConflictException(`Could not generate a unique email for ${firstName} ${lastName}. Please try again.`);
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = EmployeeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => provisioning_service_1.ProvisioningService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        kafka_producer_service_1.KafkaProducerService,
        provisioning_service_1.ProvisioningService,
        config_1.ConfigService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map