import { ObjectId } from "mongodb";
import constErr from "../utility/constErr.js";
import { validateContent } from "../utility/validateContent.js";
import { ReqResNext, User } from "../types/miscellaneous.js";

// POST add-blog/:id
export const addBlog: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const { title, body } = req.body;
  const cleanBody = body?.trim();
  const cleanTitle = title?.trim();

  if (!id || !ObjectId.isValid(id) || !cleanTitle || !cleanBody) {
    console.error("Invalid or missing ID, title, or body");
    return constErr(400, "Invalid or missing ID, title, or body", next);
  }

  const db = req.db!;
  const userObjectId = new ObjectId(id);

  try {
    const result = validateContent(`${cleanTitle}, ${cleanBody}`, "blog");

    if (!result.valid) {
      console.error(`Blog validation failed: ${result.mssg}`);
      return constErr(400, result.mssg, next);
    }

    //  check whether or not the user exists
    const user = await db.collection("users").findOne({ _id: userObjectId });
    if (!user) {
      console.error("User does not exist");
      return constErr(
        404,
        "Oops! user does not exist, please signup and come back again!",
        next,
      );
    }

    const insertResult = await db.collection("blogs").insertOne({
      title: cleanTitle,
      body: cleanBody,
      authorId: userObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: [],
      dislikes: [],
      views: [],
    });

    res.status(201).json({
      mssg: "Blog posted successfully",
      blogId: insertResult.insertedId,
    });
  } catch (error) {
    console.error("Error posting blog", error);
    return constErr(500, "Server error occured during posting a blog", next);
  }
};

// POST add-comment/:id
export const addComment: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const { blogId, comment } = req.body;
  const cleanComment = comment?.trim();

  if (!cleanComment || !id || !blogId)
    return constErr(400, "Comment cannot be empty", next);

  if (!ObjectId.isValid(id) || !ObjectId.isValid(blogId)) {
    console.error("Invalid or malformed IDs");
    return constErr(400, "Invalid or malformed ID, or blogId", next);
  }
  try {
    const result = validateContent(cleanComment, "comment");

    if (!result.valid) return constErr(400, result.mssg, next);

    const db = req.db!;
    const commenterId = new ObjectId(id);

    const commenter = await db
      .collection<User>("users")
      .findOne({ _id: commenterId });

    if (!commenter) {
      return constErr(404, "Comment author not found", next);
    }

    const commentData = {
      commenterId,
      blogId: new ObjectId(blogId),
      comment: cleanComment,
      likes: [],
      dislikes: [],
      createdAt: new Date(),
    };

    const insertResult = await req
      .db!.collection("comments")
      .insertOne(commentData);

    const newComment = {
      ...commentData,
      _id: insertResult.insertedId,
      commenterName: commenter.name || "Unknown user",
      buffer: commenter.buffer ? commenter.buffer.toString("base64") : null,
      mimetype: commenter.mimetype,
    };

    res.status(201).json({ newComment });
  } catch (error) {
    console.error("Error posting a comment", error);
    return constErr(500, "Server error occured during posting a comment", next);
  }
};

// POST add-reply/:id
export const addReply: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const { blogId, commentId, reply } = req.body;
  const cleanReply = reply?.trim();

  if (!id || !cleanReply || !blogId || !commentId)
    return constErr(400, "Malformed or empty Id, or reply", next);

  if (
    !ObjectId.isValid(id) ||
    !ObjectId.isValid(blogId) ||
    !ObjectId.isValid(commentId)
  ) {
    console.error("Malformed or empty Id, or reply");
    return constErr(400, "Invalid or malformed id, blogId, or commentId", next);
  }

  try {
    const result = validateContent(cleanReply, "reply");

    if (!result.valid) return constErr(400, result.mssg, next);

    const db = req.db!;
    const replierId = new ObjectId(id);

    const replier = await db
      .collection<User>("users")
      .findOne({ _id: replierId });

    if (!replier) return constErr(404, "Reply author not found", next);

    const replyData = {
      commentId: new ObjectId(commentId),
      blogId: new ObjectId(blogId),
      replierId: new ObjectId(id),
      reply: cleanReply,
      createdAt: new Date(),
    };

    const insertResult = await db.collection("replies").insertOne(replyData);

    const newReply = {
      ...replyData,
      _id: insertResult.insertedId,
      replierName: replier.name || "Unknown user",
      buffer: replier.buffer ? replier.buffer.toString("base64") : null,
      mimetype: replier.mimetype,
    };

    res.status(201).json({ newReply });
  } catch (error) {
    console.error("Server error posting a reply", error);
    return constErr(500, "Server error occured during posting a reply", next);
  }
};
