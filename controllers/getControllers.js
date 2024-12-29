import isValidEmailSyntax from "../reUses/isValidEmail.js";

export const welcomeRoute = (req, res) => {
  res.send("This is Kalab: \nWelcome to my blog-backend");
};

export const loginRoute = (req, res) => {
  const data = req.query;
  if (isValidEmailSyntax(data.email, res)) {
    return;
  } else if (data.password.includes(" ")) {
    console.error("Password should not include space");
    return res.status(400).json({ mssg: "Password should not include space" });
  }

  req.db
    .collection("users")
    .findOne({ email: data.email })
    .then((user) => {
      if (!user) {
        console.error("no user found to to log in as");
        return res
          .status(404)
          .json({ mssg: `No user found with the email: ${data.email}.` });
      } else {
        req.db
          .collection("users")
          .findOne({ email: data.email, password: data.password })
          .then((user) => {
            if (!user) {
              console.error("Password does not match");
              return res
                .status(401)
                .json({ mssg: "Ooops! Passowrd does not match." });
            } else {
              console.log(user._id.toString());
              res.json({ id: user._id.toString() });
            }
          });
      }
    });
};
