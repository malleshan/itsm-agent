import { Router } from "express";
import { createEmployee } from "./employee.controller";

const router = Router();

router.post("/", createEmployee);

export default router;