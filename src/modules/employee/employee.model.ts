import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  name: String,
  email: String,
  role: String,
  department: String,
  status: { type: String, default: "ACTIVE" }
}, { timestamps: true });

export default mongoose.model("Employee", EmployeeSchema);