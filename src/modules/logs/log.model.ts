import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
  employeeId: String,
  email: String,
  tool: String, // github, slack, google
  status: String, // SUCCESS / FAILED
  message: String
}, { timestamps: true });

export default mongoose.model("Log", LogSchema);