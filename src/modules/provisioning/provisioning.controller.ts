import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { ProvisioningService } from './provisioning.service';
import { EmployeeEvent } from '../../kafka/kafka.producer.service';

/**
 * Kafka consumer controller.
 *
 * Listens to ITSM employee lifecycle events and delegates provisioning /
 * de-provisioning work to ProvisioningService.
 *
 * Topics:
 *   itsm.employee.onboarded  — triggers tool provisioning
 *   itsm.employee.offboarded — triggers tool de-provisioning
 */
@Controller()
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(private readonly provisioningService: ProvisioningService) {}

  @EventPattern('itsm.employee.onboarded')
  async handleEmployeeOnboarded(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const event: EmployeeEvent = this.parsePayload(message);
    this.logger.log(`[Kafka] itsm.employee.onboarded → ${event.email}`);

    await this.provisioningService.provisionEmployee(event);

    // Acknowledge the message
    const { offset } = context.getMessage();
    const partition = context.getPartition();
    const topic = context.getTopic();
    this.logger.debug(`Committed offset ${offset} on ${topic}[${partition}]`);
  }

  @EventPattern('itsm.employee.offboarded')
  async handleEmployeeOffboarded(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    const event: EmployeeEvent = this.parsePayload(message);
    this.logger.log(`[Kafka] itsm.employee.offboarded → ${event.email}`);

    await this.provisioningService.deprovisionEmployee(event);
  }

  /**
   * Kafka messages may arrive as raw strings or pre-parsed objects depending on
   * the serializer configuration. This helper normalises both cases.
   */
  private parsePayload(message: any): EmployeeEvent {
    if (typeof message === 'string') {
      return JSON.parse(message);
    }
    if (message?.value && typeof message.value === 'string') {
      return JSON.parse(message.value);
    }
    return message;
  }
}
