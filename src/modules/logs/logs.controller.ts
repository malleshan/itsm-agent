import { Document, DefaultTimestampProps, Types } from "mongoose";
import Log from "./log.model";

export const getLogs = async (req: { params: { email: any; }; }, res: { json: (arg0: { email: any; logs: (Document<unknown, {}, { employeeId?: string | null | undefined; email?: string | null | undefined; tool?: string | null | undefined; status?: string | null | undefined; message?: string | null | undefined; } & DefaultTimestampProps, { id: string; }, { timestamps: true; }> & Omit<{ employeeId?: string | null | undefined; email?: string | null | undefined; tool?: string | null | undefined; status?: string | null | undefined; message?: string | null | undefined; } & DefaultTimestampProps & { _id: Types.ObjectId; } & { __v: number; }, "id"> & { id: string; })[]; }) => void; }) => {
  const logs = await Log.find({ email: req.params.email });

  res.json({
    email: req.params.email,
    logs
  });
};