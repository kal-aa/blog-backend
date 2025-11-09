import { getDb } from "../db.js";
import { ReqResNext } from "../types/miscellaneous.js";

export const attachDb: ReqResNext = (req, res, next) => {
  try {
    req.db = getDb();
    next();
  } catch (err) {
    console.error("Database not initialized", err);
    res.status(500).json({ mssg: "Database not connected" });
  }
};
