import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  req.user = {
    tenantId: "tenant123"
  };

  next();
};