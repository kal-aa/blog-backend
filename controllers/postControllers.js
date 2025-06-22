import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import hashPassword from "../reUses/hashPassword.js";
import comparePassword from "../reUses/comparePassword.js";
import isInvalidEmailSyntax from "../reUses/isInvalidEmailSyntax.js";
import isInvalidName from "../reUses/isInvalidName.js";
import { validateContent } from "../reUses/validateContent.js";

//  /sign-up
export const signup = async (req, res, next) => {
  let { email, name, password } = req.body;
  if (!email || !name || !password) {
    console.error("invalid request object");
    return constErr(400, "Please fill all the inputs", next);
  }

  email = email.toLowerCase();

  let imageBuffer = null;
  let imageMimetype = null;

  if (req.file) {
    imageBuffer = req.file.buffer;
    imageMimetype = req.file.mimetype;
  }

  if (isInvalidEmailSyntax(email, next)) {
    return;
  } else if (isInvalidName(name, next)) {
    return;
  } else if (password.includes(" ")) {
    console.error("Password should not include space");
    return constErr(400, "Password cannot include spaces.", next);
  }

  try {
    const hashedPassword = await hashPassword(password);
    password = hashedPassword;
  } catch (error) {
    console.error("An error occurred during hashing password:", error.message);
    return constErr(500, "Failed to process password", next);
  }

  const user = await req.db
    .collection("users")
    .findOne({ email: email.toLowerCase() });
  if (user) {
    return constErr(
      409,
      "The provided email address is already associated with an account. Log in or use another email to register.",
      next
    );
  }
  const result = await req.db.collection("users").insertOne({
    email,
    name: name.trim(),
    password,
    buffer: imageBuffer,
    mimetype: imageMimetype,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.status(201).send({ ...result, name });
};

//  /log-in
export const login = async (req, res, next) => {
  let { password, email } = req.body;
  if (!password || !email) {
    console.error("the req body values are not available");
    return constErr(400, "Please fill the required inputs", next);
  }
  email = email.toLowerCase();

  if (isInvalidEmailSyntax(email, next)) {
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

    res.json({ id: user._id.toString(), name: user.name });
  } catch (error) {
    if (error.message === "Incorrect password, please try again") {
      return constErr(401, error.message, next);
    }
    console.error("Error occured while comparing password");
    return constErr(500, next);
  }
};

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
      comments: [],
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
      replies: [],
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

//  /account/authenticate/:id
export const accountAuthenticate = async (req, res, next) => {
  const { id } = req.params;
  const { password } = req.body;

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
    if (error.message === "Incorrect password, please try again") {
      return constErr(401, error.message, next);
    }
    constErr(500, error, next);
  }
};
