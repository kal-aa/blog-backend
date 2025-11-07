import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDb, getDb } from "./db.js";
import route from "./routes/indexRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import error from "./reUses/error.js";
import { attachDb } from "./middleware/attachDb.js";
dotenv.config();
const port = process.env.PORT || 5000;
const app = express();
let db = null;
connectToDb((error) => {
    if (!error) {
        app.listen(port, () => {
            console.log("Listening to port: ", port);
        });
        db = getDb();
    }
    else {
        console.error("Failed to connect to the databse:", error);
        process.exit(1);
    }
});
app.use(cors());
app.use(express.json());
app.use(attachDb);
app.use("/auth", authRoutes);
app.use(route);
app.use(error);
//# sourceMappingURL=index.js.map