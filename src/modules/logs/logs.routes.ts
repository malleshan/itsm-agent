import { Router } from "express";
import { getLogs } from "./logs.controller";

const router = Router();

router.get("/:email", getLogs);

export default router;