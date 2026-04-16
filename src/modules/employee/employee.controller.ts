import { Request, Response, NextFunction } from "express";
import { createEmployeeService } from "./employee.service";

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = await createEmployeeService(req.body);

    res.status(201).json({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      createdAt: employee.createdAt
    });

  } catch (error) {
    next(error); // important 🚨
  }
};