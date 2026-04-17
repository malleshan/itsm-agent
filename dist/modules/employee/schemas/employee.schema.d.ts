import { Document } from 'mongoose';
export type EmployeeDocument = Employee & Document;
export declare enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    OFFBOARDED = "OFFBOARDED"
}
export declare class Employee {
    tenantId: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: EmployeeStatus;
}
export declare const EmployeeSchema: import("mongoose").Schema<Employee, import("mongoose").Model<Employee, any, any, any, Document<unknown, any, Employee, any, {}> & Employee & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Employee, Document<unknown, {}, import("mongoose").FlatRecord<Employee>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Employee> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
