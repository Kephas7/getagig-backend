import express, { Application } from "express";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";

const app: Application = express();
async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}
startServer();
