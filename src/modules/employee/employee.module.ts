import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from './schemas/employee.schema';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { KafkaModule } from '../../kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    KafkaModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
