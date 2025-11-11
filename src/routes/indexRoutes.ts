import { Router } from "express";
import upload from "../uploadConfig.js";
import { authenticate } from "../middleware/auth.js";
import {
  getBlogs,
  getCommentsForBlog,
  getRepliesForComment,
  welcome,
  yourBlogs,
  accountData,
} from "../controllers/getControllers.js";
import {
  interaction,
  accountUpdate,
  patchBlog,
} from "../controllers/patchControllers.js";
import {
  addBlog,
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

//  CREATE
route.post("/add-blog/:id", addBlog);
route.post("/add-comment/:id", addComment);
route.post("/add-reply/:id", addReply);

//  READ
route.get("/", welcome);
route.get("/your-blogs/:id", yourBlogs);
route.get("/blogs/:id", getBlogs);
route.get("/blogs/:id/comments", getCommentsForBlog);
route.get("/comments/:id/replies", getRepliesForComment);
route.get("/account/data/:id", authenticate, accountData);

//  UPDATE
route.patch("/account/update/:id", upload.single("image"), accountUpdate);
route.patch("/interaction/:postId", interaction);
route.patch("/patch-blog/:id", patchBlog);

//  DELETE
route.delete("/account/delete/:id", accountDelete);
route.delete("/delete-blog/:id", deleteBlog);
route.delete("/delete-comment/:id", deleteComment);
route.delete("/delete-reply/:id", deleteReply);

export default route;
