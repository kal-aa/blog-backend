import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import error from "./utility/error.js";
import authRoutes from "./routes/authRoutes.js";
import { attachDb } from "./middleware/attachDb.js";
import route from "./routes/indexRoutes.js";

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(attachDb);

app.use("/auth", authRoutes);
app.use(route);

app.use(error);



if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log("Listening to port:", port);
  });
}


export default app;
