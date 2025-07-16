import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import hashPassword from "../reUses/hashPassword.js";
import comparePassword from "../reUses/comparePassword.js";
import isInvalidEmailSyntax from "../reUses/isInvalidEmailSyntax.js";
import isInvalidName from "../reUses/isInvalidName.js";
import { validateContent } from "../reUses/validateContent.js";

//  add-blog/:id
export const addBlog = async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;

  try {
    const result = validateContent(`${data.title}, ${data.body}`, "blog");

    if (!ObjectId.isValid(id)) {
      console.error("Invalid id");
      return constErr(400, "Please login or signup again!", next);
    } else if (!result.valid) {
      console.error("inappropriate content");
      return constErr(400, result.mssg, next);
    }

    //  check whether or not the user exists
    const user = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });
    if (!user) {
      console.error("User does not exist");
      return constErr(
        404,
        "Oops! user does not exist, please signup and come back again!",
        next
      );
    }

    await req.db.collection("blogs").insertOne({
      ...data,
      authorId: ObjectId.createFromHexString(id),
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: [],
      dislikes: [],
      views: [],
    });
    res.end();
  } catch (error) {
    console.error("Error posting blog", error);
    return constErr(500, new Error(), next);
  }
};

//  add-comment/:id
export const addComment = async (req, res, next) => {
  const { id } = req.params;
  const { blogId, comment } = req.body;

  try {
    if (!comment || !comment.trim()) {
      return constErr(400, "Comment cannot be empty", next);
    }

    const result = validateContent(comment, "comment");

    if (!result.valid) {
      console.error("inappropriate content");
      return constErr(400, result.mssg, next);
    }

    if (!ObjectId.isValid(id) || !ObjectId.isValid(blogId)) {
      console.error("Invalid id");
      return constErr(
        400,
        "Please login or signup again!, just click the logo",
        next
      );
    }

    const commentData = {
      _id: new ObjectId(),
      commenterId: new ObjectId(id),
      blogId: new ObjectId(blogId),
      comment,
      likes: [],
      dislikes: [],
      timeStamp: new Date(),
    };

    await req.db.collection("comments").insertOne(commentData);
    return res.status(201).json({ newComment: commentData });
  } catch (error) {
    console.error("Error posting comment", error);
    return constErr(500, new Error(), next);
  }
};

//  add-reply/:id
export const addReply = async (req, res, next) => {
  const { id } = req.params;
  const { blogId, commentId, reply } = req.body;

  try {
    if (!reply || !reply.trim()) {
      return constErr(400, "Reply cannot be empty", next);
    }

    const result = validateContent(reply, "reply");

    if (!result.valid) {
      console.error("inappropriate content");
      return constErr(400, result.mssg, next);
    }

    if (
      !ObjectId.isValid(id) ||
      !ObjectId.isValid(blogId) ||
      !ObjectId.isValid(commentId)
    ) {
      console.error("Invalid id");
      return constErr(
        400,
        "Please login or signup again!, just click the logo",
        next
      );
    }

    const replyData = {
      _id: new ObjectId(),
      commentId: new ObjectId(commentId),
      blogId: new ObjectId(blogId),
      replierId: new ObjectId(id),
      reply,
      timeStamp: new Date(),
    };
    await req.db.collection("replies").insertOne(replyData);
    return res.status(201).json({ newReply: replyData });
  } catch (error) {
    console.error("Error posting reply", error);
    return constErr(500, new Error(), next);
  }
};
