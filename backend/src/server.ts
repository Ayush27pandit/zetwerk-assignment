import app from "./app";
import { config } from "./config/env";
import { connectDB } from "./config/db";

const start = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
