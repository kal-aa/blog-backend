import { Router } from "express";
import {
  login,
  manageAccountPassword,
  welcome,
} from "../controllers/getControllers.js";
import { signupRoute } from "../controllers/postControllers.js";
import { manageAccountUpdate } from "../controllers/patchControllers.js";
import { manageAccountDelete } from "../controllers/deleteController.js";

const route = Router();

//  create
route.post("/sign-up", signupRoute);

//  read
route.get("/", welcome);
route.get("/log-in", login);
route.get("/manage-account-password/:id", manageAccountPassword);

//  update
route.patch("/manage-account-update/:id", manageAccountUpdate);

//  delete
route.delete("/manage-account-delete/:id", manageAccountDelete);

export default route;
