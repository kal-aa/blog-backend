import { getDb } from "../db.js";
export const attachDb = (req, res, next) => {
    try {
        req.db = getDb();
        next();
    }
    catch (err) {
        console.error("Database not initialized", err);
        res.status(500).json({ mssg: "Database not connected" });
    }
};
//# sourceMappingURL=attachDb.js.map