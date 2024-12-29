import db from "../index.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";
import isValidName from "../reUses/isValidName.js";

//  /sign-up
export const signupRoute = (req, res) => {
  const data = req.body;
  if (isValidEmailSyntax(data.email, res)) {
    return;
  } else if (isValidName(data.name.replace(/\s+/g, ""), res)) {
    return;
  } else if (data.password.includes(" ")) {
    console.error("Password should not include space");
    return res.status(400).json({ mssg: "Password should not include space" });
  }

  req.db
    .collection("users")
    .findOne({ email: data.email })
    .then((user) => {
      if (user) {
        return res
          .status(409)
          .json({
            mssg: "❌ This email is already taken, please login if it's yours or use another email",
          });
      }
      req.db
        .collection("users")
        .insertOne(data)
        .then((result) => {
          console.log(result);
          res.status(201).send(result);
        });
    });
};
