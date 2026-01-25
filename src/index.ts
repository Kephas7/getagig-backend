import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";
import userRoutes from "./routes/user.route";
import { success } from "zod";
import cors from 'cors';

const app: Application = express();
const corsOptions = {
    origin:[ 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005' ],
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", userRoutes);
app.get("/", (req: Request, res: Response) => {
  return res
    .status(200)
    .json({ success: true, message: "Welcome to Get-a-Gig" });
});

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}
startServer();
