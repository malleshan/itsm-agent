import express from "express";
import employeeRoutes from "./modules/employee/employee.routes";
import { errorHandler } from "./middleware/error.middleware";
import logRoutes from "./modules/logs/logs.routes"  ;


const app = express();

app.use(express.json());
app.use("/logs", logRoutes);

app.use("/employees", employeeRoutes);

app.use("/logs", logRoutes);

// error handler last
app.use(errorHandler);

export default app;