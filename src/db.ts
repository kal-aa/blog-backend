import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!uri || !dbName) {
  throw new Error("MONGO_URI and/or DB_NAME is not defined in .env");
}

let client: MongoClient | null = null;
let dbConnection: Db | null = null;

export const connectToDb = async (): Promise<Db> => {
  if (dbConnection) {
    return dbConnection;
  }

try {
  client = new MongoClient(uri);

  await client.connect();

  dbConnection = client.db(dbName);

  console.log("Database connected");

  return dbConnection;
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
  throw error;
}
};

export const getDb = (): Db => {
  if (!dbConnection) {
    throw new Error("Database not connected");
  }
  return dbConnection;
};
