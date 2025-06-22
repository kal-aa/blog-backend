import { Router } from "express";
import upload from "../uploadConfig.js";
import {
  getBlogs,
  getCommentsForBlog,
  getRepliesForComment,
  welcome,
  yourBlogs,
} from "../controllers/getControllers.js";
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
  addReply,
  addComment,
} from "../controllers/postControllers.js";
import {
  deleteBlog,
  deleteComment,
  accountDelete,
  deleteReply,
} from "../controllers/deleteController.js";

const route = Router();

//  create
route.post("/sign-up", upload.single("image"), signup);
route.post("/log-in", login);
route.post("/add-blog/:id", addBlog);
route.post("/add-comment/:id", addComment);
route.post("/add-reply/:id", addReply);
route.post("/account/authenticate/:id", accountAuthenticate);

//  read
route.get("/", welcome);
route.get("/your-blogs/:id", yourBlogs);
route.get("/blogs/:id", getBlogs);
route.get("/blogs/:id/comments", getCommentsForBlog);
route.get("/comments/:id/replies", getRepliesForComment);

//  update
route.patch("/account/update/:id", upload.single("image"), accountUpdate);
route.patch("/interaction/:postId", interaction);
route.patch("/patch-blog/:id", patchBlog);

//  delete
route.delete("/account/delete/:id", accountDelete);
route.delete("/delete-blog/:id", deleteBlog);
route.delete("/delete-comment/:id", deleteComment);
route.delete("/delete-reply/:id", deleteReply);

export default route;
