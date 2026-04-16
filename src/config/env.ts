import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 1000,
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!
};