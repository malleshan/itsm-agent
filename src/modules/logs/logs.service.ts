import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument, LogAction, LogStatus } from './schemas/log.schema';

export interface CreateLogDto {
  employeeId: string;
  tenantId: string;
  email: string;
  tool: string;
  action: LogAction;
  status: LogStatus;
  message: string;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<LogDocument>,
  ) {}

  async create(dto: CreateLogDto): Promise<LogDocument> {
    const log = await this.logModel.create(dto);
    this.logger.log(`[${dto.action}][${dto.status}] ${dto.tool} → ${dto.email}: ${dto.message}`);
    return log;
  }

  async findByEmail(email: string): Promise<LogDocument[]> {
    return this.logModel.find({ email }).sort({ createdAt: -1 }).exec();
  }

  async findByEmployeeId(employeeId: string): Promise<LogDocument[]> {
    return this.logModel.find({ employeeId }).sort({ createdAt: -1 }).exec();
  }

  async findByTenantId(tenantId: string): Promise<LogDocument[]> {
    return this.logModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
  }
}
