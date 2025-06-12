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
  if (!ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const user = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (user.length === 0) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }

    const blogs = await req.db
      .collection("blogs")
      .aggregate([
        { $match: { authorId: ObjectId.createFromHexString(id) } },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "blogId",
            as: "comments",
          },
        },
      ])
      .toArray();

    const commenterIds = blogs.flatMap((blog) => {
      return blog.comments.map((comment) => comment.commenterId);
    });

    const replierIds = blogs.flatMap((blog) => {
      return blog.comments.flatMap((comment) => {
        return comment.replies.map((reply) => reply.replierId);
      });
    });

    const replierAndCommenters = [...new Set([...commenterIds, ...replierIds])];
    const users = await req.db
      .collection("users")
      .find({ _id: { $in: replierAndCommenters.map((id) => id) } })
      .toArray();

    const usersMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const blogsWithAuthors = blogs.map((blog) => {
      // Process comments with commenter details
      const commentsWithDetails = blog.comments.map((comment) => {
        const commenter = usersMap[comment.commenterId.toString()] || {
          name: "Unknown user",
        };

        // Handle commenter image
        let commenterImageBuffer = null;
        let commenterImageMimetype = null;
        if (commenter.buffer && commenter.mimetype) {
          commenterImageMimetype = commenter.mimetype;
          if (commenter.buffer._bsontype === "Binary") {
            commenterImageBuffer = Buffer.from(
              commenter.buffer.buffer
            ).toString("base64");
          } else {
            commenterImageBuffer = Buffer.from(commenter.buffer, "base64");
          }
        }

        const replierWithDetails = comment.replies.map((reply) => {
          const replier = usersMap[reply.replierId] || {
            name: "Unknown user",
          };

          let replierImageBuffer = null;
          let replierImageMimetype = null;
          if (replier.buffer && replier.mimetype) {
            replierImageMimetype = replier.mimetype;
            if (replier.buffer._bsontype === "Binary") {
              replierImageBuffer = Buffer.from(replier.buffer.buffer).toString(
                "base64"
              );
            } else {
              replierImageBuffer = Buffer.from(replier.buffer, "base64");
            }
          }

          return {
            ...reply,
            replierName: replier.name,
            buffer: replierImageBuffer,
            mimetype: replierImageMimetype,
          };
        });

        return {
          ...comment,
          commenterName: commenter.name,
          buffer: commenterImageBuffer,
          mimetype: commenterImageMimetype,
          replies: replierWithDetails,
        };
      });
      return {
        ...blog,
        comments: commentsWithDetails,
      };
    });

    res.json(blogsWithAuthors);
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};

//  /all-blogs/:id
export const allBlogs = async (req, res, next) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 0;
  const bookPerPage = 10;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  const totalBlogs = await req.db.collection("blogs").countDocuments();
  const totalPages = Math.ceil(totalBlogs / bookPerPage);

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
      .aggregate([
        { $skip: page * bookPerPage },
        { $limit: bookPerPage },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "blogId",
            as: "comments",
          },
        },
      ])
      .toArray();

    const authorIds = blogs.map((blog) => blog.authorId);
    const commenterIds = blogs.flatMap((blog) =>
      blog.comments.map((comment) => comment.commenterId)
    );
    const replierIds = blogs.flatMap((blog) => {
      return blog.comments.flatMap((comment) => {
        return comment.replies.map((reply) => reply.replierId);
      });
    });

    // combine the arrays and fetch once
    const userIds = [
      ...new Set([...authorIds, ...commenterIds, ...replierIds]),
    ];
    const users = await req.db
      .collection("users")
      .find({ _id: { $in: userIds.map((id) => id) } })
      .toArray();

    // Create a map for easy lookup of users by their IDs
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    // Process blogs with authors and comments
    const blogsWithAuthors = blogs.map((blog) => {
      const author = userMap[blog.authorId.toString()] || {
        name: "Unknown user",
      };

      // Handle author image
      let authorImageBuffer = null;
      let authorImageMimetype = null;
      if (author.buffer && author.mimetype) {
        authorImageMimetype = author.mimetype;
        if (author.buffer._bsontype === "Binary") {
          authorImageBuffer = Buffer.from(author.buffer.buffer).toString(
            "base64"
          );
        } else {
          authorImageBuffer = Buffer.from(author.buffer, "base64");
        }
      }

      // Process comments with commenter details
      const commentsWithDetails = blog.comments.map((comment) => {
        const commenter = userMap[comment.commenterId.toString()] || {
          name: "Unknown user",
        };

        // Handle commenter image
        let commenterImageBuffer = null;
        let commenterImageMimetype = null;
        if (commenter.buffer && commenter.mimetype) {
          commenterImageMimetype = commenter.mimetype;
          if (commenter.buffer._bsontype === "Binary") {
            commenterImageBuffer = Buffer.from(
              commenter.buffer.buffer
            ).toString("base64");
          } else {
            commenterImageBuffer = Buffer.from(commenter.buffer, "base64");
          }
        }

        const replierWithDetails = comment.replies.map((reply) => {
          const replier = userMap[reply.replierId] || {
            name: "Unknown user",
          };

          let replierImageBuffer = null;
          let replierImageMimetype = null;
          if (replier.buffer && replier.mimetype) {
            replierImageMimetype = replier.mimetype;
            if (replier.buffer._bsontype === "Binary") {
              replierImageBuffer = Buffer.from(replier.buffer.buffer).toString(
                "base64"
              );
            } else {
              replierImageBuffer = Buffer.from(replier.buffer, "base64");
            }
          }

          return {
            ...reply,
            replierName: replier.name,
            buffer: replierImageBuffer,
            mimetype: replierImageMimetype,
          };
        });

        return {
          ...comment,
          commenterName: commenter.name,
          buffer: commenterImageBuffer,
          mimetype: commenterImageMimetype,
          replies: replierWithDetails,
        };
      });

      return {
        ...blog,
        author: author.name,
        buffer: authorImageBuffer,
        mimetype: authorImageMimetype,
        comments: commentsWithDetails,
      };
    });

    res.json({ blogsWithAuthors, totalPages });
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};
