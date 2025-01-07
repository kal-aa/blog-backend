import { ObjectId } from "mongodb";
import comparePassword from "../reUses/comparePassword.js";
import constErr from "../reUses/constErr.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";

//  /welcome
export const welcome = (req, res, next) => {
  res.send("This is Kalab: \nWelcome to my blog-backend");
};

//  /log-in
export const login = async (req, res, next) => {
  const { password, email } = req.query;
  if (isValidEmailSyntax(email, next)) {
    return;
  } else if (password.includes(" ")) {
    console.error("Password should not include space");
    return constErr(400, "Password should not include space", next);
  }

  try {
    const user = await req.db.collection("users").findOne({ email });

    if (!user) {
      console.error("No user found to to log in as");
      return constErr(400, `No user found with the email: ${email}.`, next);
    }
    await comparePassword(password, user.password);

    const orignialName = user.name.trim().split(" ")[0];
    const name = orignialName.charAt(0).toUpperCase() + orignialName.slice(1);
    res.json({ id: user._id.toString(), name });
  } catch (error) {
    if (error.message === "Incorrect password") {
      return constErr(401, error.message, next);
    }
  }
};

//  /manage-account-password/:id
export const manageAccountPassword = async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.query;
  if (!ObjectId.isValid(id)) {
    console.error("Invalid client id, BSONError");
    return constErr(400, "Please login or signup again", next);
  }

  try {
    const user = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }
    await comparePassword(password, user.password);

    let imageBuffer = null;
    let imgageMimetype = null;
    if (user.buffer && user.mimetype) {
      imgageMimetype = user.mimetype;
      if (user.buffer._bsontype === "Binary") {
        imageBuffer = Buffer.from(user.buffer.buffer).toString("base64");
      } else {
        imageBuffer = Buffer.from(user.buffer, "base64");
      }
    }

    const data = {
      buffer: imageBuffer,
      mimetype: imgageMimetype,
      ...user,
      password,
    };

    res.json(data);
  } catch (error) {
    if (error.message === "Incorrect password") {
      constErr(401, error.message, next);
    }
  }
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
      .find({ authorId: ObjectId.createFromHexString(id) })
      .toArray();

    const author = { author: user.name };
    const blogsWithAughor = blogs.map((blog) => Object.assign(blog, author));

    res.json(blogsWithAughor);
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};

//  /all-blogs/:id
export const allBlogs = async (req, res, next) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 0;
  const bookPerPage = 2;

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
            name: "Unknow user",
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
