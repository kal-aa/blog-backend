import { DecodedIdToken } from "firebase-admin/auth";
import { Db } from "mongodb";

declare module "express-serve-static-core" {
  interface Request {
    db?: Db;
    user?: DecodedIdToken;
  }
}
