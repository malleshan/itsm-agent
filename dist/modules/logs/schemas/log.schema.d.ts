import { Document } from 'mongoose';
export type LogDocument = Log & Document;
export declare enum LogStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}
export declare enum LogAction {
    PROVISION = "PROVISION",
    DEPROVISION = "DEPROVISION"
}
export declare class Log {
    employeeId: string;
    tenantId: string;
    email: string;
    tool: string;
    action: LogAction;
    status: LogStatus;
    message: string;
}
export declare const LogSchema: import("mongoose").Schema<Log, import("mongoose").Model<Log, any, any, any, Document<unknown, any, Log, any, {}> & Log & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Log, Document<unknown, {}, import("mongoose").FlatRecord<Log>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Log> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
