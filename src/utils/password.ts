import crypto from "crypto";

export const generatePassword = () => {
  return crypto.randomBytes(6).toString("hex");
};