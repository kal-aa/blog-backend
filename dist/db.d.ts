import { Db } from "mongodb";
type DbCallback = (error?: Error) => void;
export declare const connectToDb: (cb: DbCallback) => Promise<void>;
export declare const getDb: () => Db;
export {};
