import { adminAuth } from "../config/firebase.js";
import constErr from "../utility/constErr.js";
import { ReqResNext } from "../types/miscellaneous.js";

export const authenticate: ReqResNext = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer "))
    return constErr(401, "Unauthorized access", next);

  const idToken = authHeader.split(" ")[1];

  try {
    if (!idToken) throw new Error("Missing idToken");

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};
