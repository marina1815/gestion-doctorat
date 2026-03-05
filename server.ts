import express, { Request, Response } from "express";
import path from "path";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import faculteRoutes from "./routes/faculte.routes";
import departementRoutes from "./routes/departement.routes";
import concoursRoutes from "./routes/concours.routes";
import candidatRoutes from "./routes/candidat.routes";
import specialiteRoutes from "./routes/specialite.routes";
import membreRoutes from "./routes/membre.routes";
import correcteurRoutes from "./routes/correcteur.routes";
import viceDoyenRoutes from "./routes/viceDoyen.route";
import doyenRoutes from "./routes/doyen.route";
import cfdRoutes from "./routes/cfd.routes";
import celluleAnonymatRoutes from "./routes/celluleAnonymat.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { sanitize } from "./middleware/sanitize";

import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// -----------------------------
// 🟢 CORS DOIT ÊTRE AVANT TOUT
// -----------------------------
app.use(
  cors({
    origin: "http://localhost:4000", // ton front
    credentials: true,              // autorise cookies + sessions
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(sanitize);

app.use(express.static(path.join(__dirname, "public")));

// PAGE D'ACCUEIL
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ROUTES
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/facultes", faculteRoutes);
app.use("/departements", departementRoutes);
app.use("/concours", concoursRoutes);
app.use("/specialites", specialiteRoutes);
app.use("/candidats", candidatRoutes);
app.use("/membres", membreRoutes);
app.use("/vice-doyens", viceDoyenRoutes);
app.use("/cfds", cfdRoutes);
app.use("/doyens", doyenRoutes);


app.use("/cellules-anonymat", celluleAnonymatRoutes);
app.use("/correcteurs", correcteurRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// SERVER
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);