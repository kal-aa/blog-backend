import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDb, getDb } from "./db.js";
import route from "./routes/indexRoutes.js";
import error from "./reUses/error.js";

dotenv.config();
const port = process.env.PORT || 5000;
const app = express();
let db;

connectToDb((error) => {
  if (!error) {
    app.listen(port, () => {
      console.log("Listening to port: ", port);
    });
    db = getDb();
  } else {
    console.error("Failed to connect to the databse:", error);
  }
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  req.db = db;
  next();
});
app.use(route);
app.use(error);
