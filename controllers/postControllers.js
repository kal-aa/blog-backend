import constErr from "../reUses/constErr.js";
import hashPassword from "../reUses/hashPassword.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";
import isValidName from "../reUses/isValidName.js";

//  /sign-up
export const signupRoute = async (req, res, next) => {
  const data = req.body;
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
  const result = await req.db
    .collection("users")
    .insertOne({ ...data, createdAt: new Date(), updatedAt: new Date() });
  console.log(result);
  res.status(201).send(result);
};
