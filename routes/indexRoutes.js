import { Router } from "express";
import { loginRoute, welcomeRoute } from "../controllers/getControllers.js";
import { signupRoute } from "../controllers/postControllers.js";

const route = Router();

//  create
route.post("/sign-up", signupRoute);

//  read
route.get("/", welcomeRoute);
route.get("/log-in", loginRoute);

//  update

//  delete

export default route;
