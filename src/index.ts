import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import error from "./utility/error.js";
import { connectToDb } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import { attachDb } from "./middleware/attachDb.js";
import route from "./routes/indexRoutes.js";

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();

connectToDb((error) => {
  if (error) {
    console.error("Failed to connect to the databse:", error);
    process.exit(1);
  }
  app.listen(port, () => {
    console.log("Listening to port: ", port);
  });
});

app.use(cors());
app.use(express.json());
app.use(attachDb);

app.use("/auth", authRoutes);
app.use(route);

app.use(error);
