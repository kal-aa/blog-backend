import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

let serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Replace literal "\n" with actual new line characters in private_key
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

dotenv.config();

initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth();
