import { ObjectId } from "mongodb";
import comparePassword from "../reUses/comparePassword.js";
import constErr from "../reUses/constErr.js";

//  /welcome
export const welcome = (req, res, next) => {
  res.send("This is Kalab: \nWelcome to my blog-backend");
};

//  /your-blogs/:id
export const yourBlogs = async (req, res, next) => {
  const { id } = req.params;
  const { page: index } = req.query;

  const page = Number(index) || 0;
  const blogsPerPage = 5;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const user = await req.db
      .collection("users")
      .find({ _id: new ObjectId(id) });

    if (user.length === 0) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }

    const blogs = await req.db
      .collection("blogs")
      .find({ authorId: new ObjectId(id) })
      .skip(page * blogsPerPage)
      .limit(blogsPerPage)
      .sort({ createdAt: -1 })
      .toArray();

    const totalBlogs = await req.db
      .collection("blogs")
      .countDocuments({ authorId: new ObjectId(id) });
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    res.json({ blogs, totalPages });
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};

// GET /blogs/:id
export const getBlogs = async (req, res, next) => {
  const { id } = req.params;

  const page = Number(req.query.page) || 0;
  const blogsPerPage = 10;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const checkUser = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!checkUser) {
      console.error("User not found");
      return constErr(400, "Please login or signup again", next);
    }

    const blogs = await req.db
      .collection("blogs")
      .find()
      .skip(page * blogsPerPage)
      .limit(blogsPerPage)
      .sort({ createdAt: -1 })
      .toArray();

    const authorIds = blogs.map((blog) => blog.authorId);
    const users = await req.db
      .collection("users")
      .find({ _id: { $in: authorIds } })
      .toArray();

    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const blogsWithAuthors = blogs.map((blog) => {
      const author = userMap[blog.authorId.toString()] || {
        name: "Unknown user",
      };
      let authorImageBuffer = null;
      let authorImageMimetype = null;
      if (author.buffer && author.mimetype) {
        authorImageMimetype = author.mimetype;
        authorImageBuffer =
          author.buffer._bsontype === "Binary"
            ? Buffer.from(author.buffer.buffer).toString("base64")
            : Buffer.from(author.buffer, "base64").toString("base64");
      }
      return {
        ...blog,
        author: author.name,
        buffer: authorImageBuffer,
        mimetype: authorImageMimetype,
      };
    });

    const totalBlogs = await req.db.collection("blogs").countDocuments();
    const totalPages = Math.ceil(totalBlogs / blogsPerPage);

    res.json({ blogsWithAuthors, totalPages });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return constErr(500, "Error fetching blogs", next);
  }
};

// GET /blogs/:id/comments
export const getCommentsForBlog = async (req, res, next) => {
  const { id } = req.params;

  try {
    const comments = await req.db
      .collection("comments")
      .find({ blogId: new ObjectId(id) })
      .sort({ timeStamp: -1 })
      .toArray();

    // Extract unique commenter IDs
    const commenterIds = [
      ...new Set([...comments.map((comment) => comment.commenterId)]),
    ];

    // Fetch user info for commenters
    const users = await req.db
      .collection("users")
      .find({ _id: { $in: commenterIds } })
      .toArray();

    // Map user IDs to user objects
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const commentsWithDetails = comments.map((comment) => {
      const commenter = userMap[comment.commenterId.toString()] || {
        name: "Unknown user",
      };
      let commenterImageBuffer = null;
      let commenterImageMimetype = null;
      if (commenter.buffer && commenter.mimetype) {
        commenterImageMimetype = commenter.mimetype;
        commenterImageBuffer =
          commenter.buffer._bsontype === "Binary"
            ? Buffer.from(commenter.buffer.buffer).toString("base64")
            : Buffer.from(commenter.buffer, "base64");
      }

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
export const getRepliesForComment = async (req, res, next) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return constErr(400, "Invalid comment ID", next);
  }

  try {
    const replies = await req.db
      .collection("replies")
      .find({ commentId: new ObjectId(id) })
      .sort({ timeStamp: -1 })
      .toArray();

    // Gather unique replierIds
    const replierIds = [...new Set(replies.map((r) => r.replierId.toString()))];

    // Fetch users in batch
    const users = await req.db
      .collection("users")
      .find({ _id: { $in: replierIds } })
      .toArray();

    // Map user ID to user data
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const repliesWithDetails = replies.map((reply) => {
      const replier = userMap[reply.replierId] || { name: "Unknown user" };
      let replierImageBuffer = null;
      let replierImageMimetype = null;
      if (replier.buffer && replier.mimetype) {
        replierImageMimetype = replier.mimetype;
        replierImageBuffer =
          replier.buffer._bsontype === "Binary"
            ? Buffer.from(replier.buffer.buffer).toString("base64")
            : Buffer.from(replier.buffer, "base64").toString("base64");
      }
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
