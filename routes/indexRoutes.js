import { Router } from "express";
import upload from "../uploadConfig.js";
import {
  allBlogs,
  login,
  manageAccountPassword,
  welcome,
  yourBlogs,
} from "../controllers/getControllers.js";
import {
  likeDislike,
  manageAccountUpdate,
  patchBlog,
} from "../controllers/patchControllers.js";
import { addBlog, signup } from "../controllers/postControllers.js";
import {
  deleteBlog,
  deleteComment,
  manageAccountDelete,
} from "../controllers/deleteController.js";

const route = Router();

//  create
route.post("/sign-up", upload.single("image"), signup);
route.post("/add-blog/:id", addBlog);

//  read
route.get("/", welcome);
route.get("/log-in", login);
route.get("/manage-account-password/:id", manageAccountPassword);
route.get("/your-blogs/:id", yourBlogs);
route.get("/all-blogs/:id", allBlogs);

//  update
route.patch(
  "/manage-account-update/:id",
  upload.single("image"),
  manageAccountUpdate
);
route.patch("/likeDislike/:postId", likeDislike);
route.patch("/patch-blog/:id", patchBlog);

//  delete
route.delete("/manage-account-delete/:id", manageAccountDelete);
route.delete("/delete-blog/:id", deleteBlog);
route.delete("/delete-comment/:id", deleteComment);

export default route;
