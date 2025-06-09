import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import hashPassword from "../reUses/hashPassword.js";
import comparePassword from "../reUses/comparePassword.js";
import { Filter } from "bad-words";
import isInvalidEmailSyntax from "../reUses/isInvalidEmailSyntax.js";
import isInvalidName from "../reUses/isInvalidName.js";

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
    name,
    password,
    buffer: imageBuffer,
    mimetype: imageMimetype,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  name = name.trim().split(" ")[0];
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);

  res.status(201).send({ ...result, firstName });
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

    const orignialName = user.name.trim().split(" ")[0];
    const name = orignialName.charAt(0).toUpperCase() + orignialName.slice(1);
    res.json({ id: user._id.toString(), name });
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

  const validateContent = (content) => {
    const filter = new Filter();
    if (filter.isProfane(content)) {
      return { valid: false, mssg: "Content contains inappropriate language" };
    }
    return { valid: true, mssg: "content is appropriate" };
  };
  const result = validateContent(`${data.title}, ${data.body}`);

  if (!ObjectId.isValid(id)) {
    console.error("Invalid id");
    return constErr(
      400,
      "Please login or signup again!, just click the logo",
      next
    );
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
};
