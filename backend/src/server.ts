import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import airlineRoutes from "./routes/airline.routes.js";
import { env } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/airline`, airlineRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
