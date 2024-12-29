import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
let dbConnection;

export const connectToDb = (cb) => {
  if (dbConnection) {
    return cb();
  }

  MongoClient.connect(uri)
    .then((client) => {
      dbConnection = client.db(dbName);
      return cb();
    })
    .catch((error) => {
      console.error(error);
      return cb(error);
    });
};
export const getDb = () => {
  if (!dbConnection) {
    throw new Error("Database not connected");
  }
  return dbConnection;
};
