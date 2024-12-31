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

    const name = user.name.trim().split(" ")[0];
    console.log(name)
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
    res.json({ ...user, password });
  } catch (error) {
    if (error.message === "Incorrect password") {
      constErr(401, error.message, next);
    }
  }
};
