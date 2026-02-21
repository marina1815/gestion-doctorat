import express, { Request, Response } from "express";
import path from "path";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
const app = express();
app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
