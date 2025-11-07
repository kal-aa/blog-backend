import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
if (!uri || !dbName) {
    throw new Error("MONGO_URI and/or DB_NAME is not defined in .env");
}
let client = null;
let dbConnection = null;
export const connectToDb = async (cb) => {
    if (dbConnection)
        return cb();
    try {
        client = await MongoClient.connect(uri);
        dbConnection = client.db(dbName);
        cb();
    }
    catch (error) {
        console.error(error);
        return cb(error);
    }
};
export const getDb = () => {
    if (!dbConnection) {
        throw new Error("Database not connected");
    }
    return dbConnection;
};
//# sourceMappingURL=db.js.map