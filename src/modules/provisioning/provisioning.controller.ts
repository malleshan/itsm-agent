import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProvisioningService } from './provisioning.service';
import { EmployeeEvent } from '../../kafka/kafka.producer.service';

/** Direct-trigger DTO for testing provisioning without Kafka. */
class TriggerProvisionDto {
  @IsString() @IsNotEmpty() employeeId: string;
  @IsString() @IsNotEmpty() tenantId: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() email: string;
  @IsString() @IsNotEmpty() role: string;
  @IsString() @IsOptional() department?: string;
}

/**
 * Kafka consumer — handles ITSM employee lifecycle events.
 *
 * Topics:
 *   itsm.employee.onboarded  → provision tools
 *   itsm.employee.offboarded → deprovision tools
 *
 * HTTP endpoints (for testing without Kafka):
 *   POST /provisioning/trigger          → provision
 *   POST /provisioning/trigger/offboard → deprovision
 */
@Controller('provisioning')
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(private readonly provisioningService: ProvisioningService) {}

  // ── Direct HTTP triggers (dev/test — no Kafka needed) ─────────────────────

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerProvision(@Body() dto: TriggerProvisionDto) {
    this.logger.log(`[HTTP-TRIGGER] provision → ${dto.email}`);
    await this.provisioningService.provisionEmployee(dto as EmployeeEvent);
    return {
      message: `Provisioning triggered for ${dto.firstName} ${dto.lastName}`,
      email: dto.email,
      role: dto.role,
    };
  }

  @Post('trigger/offboard')
  @HttpCode(HttpStatus.OK)
  async triggerDeprovision(@Body() dto: TriggerProvisionDto) {
    this.logger.log(`[HTTP-TRIGGER] deprovision → ${dto.email}`);
    await this.provisioningService.deprovisionEmployee(dto as EmployeeEvent);
    return {
      message: `De-provisioning triggered for ${dto.firstName} ${dto.lastName}`,
      email: dto.email,
    };
  }

  // ── Kafka consumers ────────────────────────────────────────────────────────

  @EventPattern('itsm.employee.onboarded')
  async handleEmployeeOnboarded(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const event: EmployeeEvent = this.parsePayload(message);
    this.logger.log(`[Kafka] onboarded → ${event.email} (tenant: ${event.tenantId})`);
    await this.provisioningService.provisionEmployee(event);

    const { offset } = context.getMessage();
    this.logger.debug(
      `Committed offset ${offset} on ${context.getTopic()}[${context.getPartition()}]`,
    );
  }

  @EventPattern('itsm.employee.offboarded')
  async handleEmployeeOffboarded(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const event: EmployeeEvent = this.parsePayload(message);
    this.logger.log(`[Kafka] offboarded → ${event.email} (tenant: ${event.tenantId})`);
    await this.provisioningService.deprovisionEmployee(event);
  }

  private parsePayload(message: any): EmployeeEvent {
    if (typeof message === 'string') return JSON.parse(message);
    if (message?.value && typeof message.value === 'string') return JSON.parse(message.value);
    return message;
  }
}
