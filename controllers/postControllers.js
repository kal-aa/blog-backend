import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import hashPassword from "../reUses/hashPassword.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";
import isValidName from "../reUses/isValidName.js";

//  /sign-up
export const signup = async (req, res, next) => {
  const data = req.body;

  let imageBuffer = null;
  let imgageMimetype = null;

  if (req.file) {
    imageBuffer = req.file.buffer;
    imgageMimetype = req.file.mimetype;
  }

  if (isValidEmailSyntax(data.email, next)) {
    return;
  } else if (isValidName(data.name, next)) {
    return;
  } else if (data.password.includes(" ")) {
    console.error("Password should not include space");
    return constErr(400, "Password should not include space", next);
  }

  try {
    const hashedPassword = await hashPassword(data.password);
    data.password = hashedPassword;
  } catch (error) {
    console.error("An error occurred during password hashing:", error.message);
    return constErr(500, "Failed to process password", next);
  }

  const user = await req.db.collection("users").findOne({ email: data.email });
  if (user) {
    return constErr(
      409,
      "❌ This email is already taken, please login if it's yours or use another email.",
      next
    );
  }
  const result = await req.db.collection("users").insertOne({
    ...data,
    buffer: imageBuffer,
    mimetype: imgageMimetype,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(result);

  const originalName = data.name.trim().split(" ")[0];
  const firstName =
    originalName.charAt(0).toUpperCase() + originalName.slice(1);

  res.status(201).send({ ...result, firstName });
};

//  add-blog/:id
export const addBlog = async (req, res, next) => {
  const id = req.params.id;
  const data = req.body;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid id");
    return constErr(
      400,
      "Please login or signup again!, just click the logo",
      next
    );
  }

  //  check whether or not the user exists
  const user = await req.db
    .collection("users")
    .findOne({ _id: ObjectId.createFromHexString(id) });
  if (!user) {
    console.error("User does not exist");
    return constErr(
      404,
      "Oops! user does not exist, please signup and come back!",
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
