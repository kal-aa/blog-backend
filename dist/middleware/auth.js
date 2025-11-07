import { adminAuth } from "../config/firebase.js";
import constErr from "../reUses/constErr.js";
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return constErr(401, "Unauthorized access", next);
    const idToken = authHeader.split(" ")[1];
    try {
        if (!idToken)
            throw new Error("Missing idToken");
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    }
    catch (err) {
        console.error("Token verification failed:", err);
        res.status(401).json({ message: "Invalid token" });
    }
};
//# sourceMappingURL=auth.js.map