import constErr from "../reUses/constErr.js";

export const signupHandler = async (req, res, next) => {
  const { uid, email, name: optName } = req.user;
  const name = req.body.name;
  let imageBuffer = null;
  let imageMimetype = null;

  if (req.file) {
    imageBuffer = req.file.buffer;
    imageMimetype = req.file.mimetype;
  }

  if (!email) {
    return constErr(400, "Email missing from token", next);
  }

  try {
    const db = req.db;
    const emailLower = email.toLowerCase();

    let user = await db.collection("users").findOne({ email: emailLower });

    if (!user) {
      const newUser = {
        uid,
        email: emailLower,
        name: name || optName || emailLower.split("@")[0],
        createdAt: new Date(),
      };

      if ((imageBuffer, imageMimetype)) {
        (newUser.buffer = imageBuffer), (newUser.mimetype = imageMimetype);
      }

      const result = await db.collection("users").insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    return res.json({
      id: user._id,
      name: user.name || email.split("@")[0],
    });
  } catch (err) {
    console.error("Sign-up DB error:", err.message);
    return constErr(500, "Internal server error", next);
  }
};

export const loginHandler = async (req, res, next) => {
  const { uid, email, name } = req.user;

  if (!email) {
    return constErr(400, "Email missing from token", next);
  }

  try {
    const db = req.db;
    const emailLower = email.toLowerCase();

    let user = await db.collection("users").findOne({ email: emailLower });

    if (!user) {
      const newUser = {
        uid,
        email: emailLower,
        name: name || emailLower.split("@")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("users").insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    return res.json({
      id: user._id,
      name: user.name || email.split("@")[0],
    });
  } catch (err) {
    console.error("Login DB error:", err.message);
    return constErr(500, "Internal server error", next);
  }
};
