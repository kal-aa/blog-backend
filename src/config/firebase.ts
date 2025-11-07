import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();
const info = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!info) throw new Error("FIREBASE_SERVICE_ACCOUNT not defined");

let serviceAccount = JSON.parse(info);

// Replace literal "\n" with actual new line characters in private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth();
