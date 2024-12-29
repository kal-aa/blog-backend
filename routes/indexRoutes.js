import { Router } from "express";
import { welcomeRoute } from "../controllers/getControllers.js";
import { signupRoute } from "../controllers/postControllers.js";

const route = Router();

//  create
route.post("/sign-up", signupRoute);

//  read
route.get("/", welcomeRoute);

//  update

//  delete

export default route;
