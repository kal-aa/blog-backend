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

    const blogs = await req.db.collection("blogs").find().toArray();
    const authorIds = blogs.map((blog) => blog.authorId);

    const users = await req.db
      .collection("users")
      .find({ _id: { $in: authorIds } })
      .toArray();

    const blogsWithAuthors = blogs.map((blog) => {
      const user = users.find(
        (user) => user._id.toString() === blog.authorId.toString()
      );

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
      return {
        ...blog,
        author: user ? user.name : "Unknown user",
        buffer: imageBuffer ? imageBuffer.toString("base64") : null,
        mimetype: imgageMimetype,
      };
    });

    res.json(blogsWithAuthors);
  } catch (error) {
    console.error("Error fetching blogs", error);
    return constErr(500, "Error fetching blogs", next);
  }
};

// const blog = await collection.findOne({ _id: new MongoClient.ObjectId(req.params.id) });

// if (blog) {
//   const imageBase64 = blog.image.toString('base64'); // Convert binary data to Base64 string
//   res.status(200).json({
//     title: blog.title,
//     content: blog.content,
//     image: `data:${blog.imageType};base64,${imageBase64}`, // Send as a Base64-encoded image
//   });
