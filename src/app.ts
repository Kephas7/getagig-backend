import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import userRoutes from "./routes/user.route";
import musicianRoutes from "./routes/musicain.routes";
import organizerRoutes from "./routes/organizer.routes";
import adminRoutes from "./routes/admin/user.route";
import cors from "cors";

const app: Application = express();
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:3005",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

//auth routes
app.use("/api/auth", userRoutes);

// musicain routes
app.use("/api/musicians", musicianRoutes);

// organizer routes
app.use("/api/organizers", organizerRoutes);

//admin routes
app.use("/api/admin/users", adminRoutes);

export default app;