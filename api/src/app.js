import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

//middleware
import { requireWorkspaceAccess } from "./middleware/workspace.js";
import { requireAuth } from "./middleware/auth.js";

//routers
import AuthRoutes from "./routes/auth.js";
import WorkspaceRoutes from "./routes/workspaces.js";
import RecordRoutes from "./routes/records.js";
import MediaRoutes from "./routes/media.js";
import UserRoutes from "./routes/users.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5174").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(AuthRoutes);

app.use(WorkspaceRoutes);

app.use("/w/:workspace", requireAuth, requireWorkspaceAccess);

app.use("/w/:workspace/", RecordRoutes, MediaRoutes, UserRoutes);

app.use((req, res) => {
  res.status(404).send("Sorry, the page you're looking for was not found.");
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: "Server error" });
});

export default app;
