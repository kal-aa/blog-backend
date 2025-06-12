import { Router } from "express";
import upload from "../uploadConfig.js";
import { allBlogs, welcome, yourBlogs } from "../controllers/getControllers.js";
import {
  interaction,
  accountUpdate,
  patchBlog,
} from "../controllers/patchControllers.js";
import {
  signup,
  login,
  addBlog,
  accountAuthenticate,
} from "../controllers/postControllers.js";
import {
  deleteBlog,
  deleteComment,
  accountDelete,
} from "../controllers/deleteController.js";

const route = Router();

//  create
route.post("/sign-up", upload.single("image"), signup);
route.post("/log-in", login);
route.post("/add-blog/:id", addBlog);
route.post("/account/authenticate/:id", accountAuthenticate);

//  read
route.get("/", welcome);
route.get("/your-blogs/:id", yourBlogs);
route.get("/all-blogs/:id", allBlogs);

//  update
route.patch("/account/update/:id", upload.single("image"), accountUpdate);
route.patch("/interaction/:postId", interaction);
route.patch("/patch-blog/:id", patchBlog);

//  delete
route.delete("/account/delete/:id", accountDelete);
route.delete("/delete-blog/:id", deleteBlog);
route.delete("/delete-comment/:id", deleteComment);

export default route;
