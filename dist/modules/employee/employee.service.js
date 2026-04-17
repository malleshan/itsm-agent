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
const mongoose_2 = require("mongoose");
const employee_schema_1 = require("./schemas/employee.schema");
const kafka_producer_service_1 = require("../../kafka/kafka.producer.service");
let EmployeeService = EmployeeService_1 = class EmployeeService {
    constructor(employeeModel, kafkaProducer) {
        this.employeeModel = employeeModel;
        this.kafkaProducer = kafkaProducer;
        this.logger = new common_1.Logger(EmployeeService_1.name);
    }
    async create(dto) {
        const email = dto.email || this.generateEmail(dto.name);
        const employee = await this.employeeModel.create({
            ...dto,
            email,
        });
        this.logger.log(`Employee created: ${employee.email} (id: ${employee._id})`);
        await this.kafkaProducer.publishOnboarded({
            employeeId: String(employee._id),
            tenantId: employee.tenantId,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            department: employee.department,
        });
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
    generateEmail(name) {
        const clean = name.toLowerCase().replace(/\s+/g, '');
        return `${clean}@terralogic.com`;
    }
    async offboard(id) {
        const employee = await this.findById(id);
        employee.status = employee_schema_1.EmployeeStatus.OFFBOARDED;
        await employee.save();
        this.logger.log(`Employee offboarded: ${employee.email}`);
        await this.kafkaProducer.publishOffboarded({
            employeeId: String(employee._id),
            tenantId: employee.tenantId,
            name: employee.name,
            email: employee.email,
            role: employee.role,
        });
        return employee;
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = EmployeeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        kafka_producer_service_1.KafkaProducerService])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map