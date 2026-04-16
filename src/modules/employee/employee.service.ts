import Employee from "./employee.model";
import { addJob } from "../../queue/queue";

export const createEmployeeService = async (data: any) => {
  const employee = await Employee.create(data);

  // trigger provisioning async
  await addJob("provision-user", employee);

  return employee;
};