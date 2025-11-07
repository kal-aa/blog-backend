import { Router } from "express";
import { loginHandler, signupHandler } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import upload from "../uploadConfig.js";
const route = Router();
route.post("/sign-up", authenticate, upload.single("image"), signupHandler);
route.post("/log-in", authenticate, loginHandler);
export default route;
//# sourceMappingURL=authRoutes.js.map