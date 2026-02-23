import express, { Request, Response } from "express";

import path from "path";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { sanitize } from "./middleware/sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(sanitize);
app.use(
  cors({
    origin: "http://localhost:4000",
    credentials: true,               
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

