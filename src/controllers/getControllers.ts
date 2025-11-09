import { ObjectId } from "mongodb";
import constErr from "../utility/constErr.js";
import {
  Blog,
  Comment,
  Reply,
  ReqResNext,
  User,
} from "../types/miscellaneous.js";

// GET /welcome
export const welcome: ReqResNext = (req, res, next) => {
  res.send("This is Kalab: \nWelcome to my blog-backend");
};

// GET /your-blogs/:id
export const yourBlogs: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const { page: index } = req.query;

  const page = Number(index) || 0;
  const blogsPerPage = 5;

  if (!id || !ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const db = req.db!;
    const authorId = new ObjectId(id);
    const user = await db.collection("users").findOne({ _id: authorId });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }

    const blogs = await db
      .collection("blogs")
      .find({ authorId })
      .skip(page * blogsPerPage)
      .limit(blogsPerPage)
      .sort({ createdAt: -1 })
      .toArray();

    const totalBlogs = await db
      .collection("blogs")
      .countDocuments({ authorId });
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    res.json({ blogs, totalPages });
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};

// GET /blogs/:id
export const getBlogs: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 0;
  const blogsPerPage = 10;

  if (!id || !ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const db = req.db!;
    const checkUser = await db
      .collection<User>("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!checkUser) {
      console.error("User not found");
      return constErr(400, "Please login or signup again", next);
    }

    const blogs = await db
      .collection<Blog>("blogs")
      .find()
      .skip(page * blogsPerPage)
      .limit(blogsPerPage)
      .sort({ createdAt: -1 })
      .toArray();

    const authorIds = blogs.map((blog) => blog.authorId);
    const users = (await db
      .collection("users")
      .find({ _id: { $in: authorIds } })
      .toArray()) as User[];

    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {} as Record<string, User>);

    const blogsWithAuthors = blogs.map((blog) => {
      const author: User = userMap[blog.authorId.toString()] || {
        _id: new ObjectId(),
        uid: "",
        email: "",
        name: "Unknown user",
        createdAt: new Date(),
      };

      const authorImageMimetype = author.mimetype || null;
      const authorImageBuffer = author.buffer
        ? author.buffer.toString("base64")
        : null;

      return {
        ...blog,
        author: author.name,
        buffer: authorImageBuffer,
        mimetype: authorImageMimetype,
      };
    });

    const totalBlogs = await db.collection("blogs").countDocuments();
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    res.json({ blogsWithAuthors, totalPages });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return constErr(500, "Error fetching blogs", next);
  }
};

// GET /blogs/:id/comments
export const getCommentsForBlog: ReqResNext = async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = req.db!;
    const comments = await db
      .collection<Comment>("comments")
      .find({ blogId: new ObjectId(id) })
      .sort({ timeStamp: -1 })
      .toArray();

    // Extract unique commenter IDs
    const commenterIds = [
      ...new Set([...comments.map((comment) => comment.commenterId)]),
    ];

    // Fetch user info for commenters
    const users = await db
      .collection<User>("users")
      .find({ _id: { $in: commenterIds } })
      .toArray();

    // Map user IDs to user objects
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {} as Record<string, User>);

    const commentsWithDetails = comments.map((comment) => {
      const commenter = userMap[comment.commenterId.toString()] || {
        _id: new ObjectId(),
        uid: "",
        email: "",
        name: "Unknown user",
        createdAt: new Date(),
      };

      const commenterImageMimetype = commenter.mimetype || null;
      const commenterImageBuffer = commenter.buffer
        ? commenter.buffer.toString("base64")
        : null;
      return {
        ...comment,
        commenterName: commenter.name,
        buffer: commenterImageBuffer,
        mimetype: commenterImageMimetype,
      };
    });

    res.json(commentsWithDetails);
  } catch (err) {
    console.error("Error fetching comments:", err);
    return constErr(500, "Error fetching comments", next);
  }
};

// GET /comments/:id/replies
export const getRepliesForComment: ReqResNext = async (req, res, next) => {
  const { id } = req.params;

  if (!id || !ObjectId.isValid(id)) {
    return constErr(400, "Invalid comment ID", next);
  }

  try {
    const db = req.db!;
    const replies = await db
      .collection<Reply>("replies")
      .find({ commentId: new ObjectId(id) })
      .sort({ timeStamp: -1 })
      .toArray();

    // Gather unique replierIds
    const replierIds = [...new Set(replies.map((r) => r.replierId))];

    // Fetch users in batch
    const users = await db
      .collection<User>("users")
      .find({ _id: { $in: replierIds } })
      .toArray();

    // Map user ID to user data
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {} as Record<string, User>);

    const repliesWithDetails = replies.map((reply) => {
      const replier = userMap[reply.replierId.toString()] || {
        _id: new ObjectId(),
        uid: "",
        email: "",
        name: "Unknown user",
        createdAt: new Date(),
      };

      const replierImageMimetype = replier.mimetype;
      const replierImageBuffer = replier.buffer
        ? replier.buffer.toString("base64")
        : null;

      return {
        ...reply,
        replierName: replier.name,
        buffer: replierImageBuffer,
        mimetype: replierImageMimetype,
      };
    });

    res.json(repliesWithDetails);
  } catch (err) {
    console.error("Error fetching replies:", err);
    return constErr(500, "Error fetching replies", next);
  }
};

// GET /account/data/:id
export const accountData: ReqResNext = async (req, res, next) => {
  const { id } = req.params;

  if (!id || !ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const db = req.db!;
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }

    const imageBuffer = user.mimetype || null;
    const imageMimetype = user?.buffer ? user.buffer.toString("base64") : null;

    const data = {
      buffer: imageBuffer,
      mimetype: imageMimetype,
      ...user,
    };

    res.json(data);
  } catch (error) {
    console.error("Error sending data", error);
    return constErr(500, "Error sending account data", next);
  }
};
