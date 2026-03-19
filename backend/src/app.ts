import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import warehouseRoutes from "./routes/warehouse.routes";
import transferRoutes from "./routes/transfer.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/transfers", transferRoutes);

app.use(errorHandler);

export default app;
