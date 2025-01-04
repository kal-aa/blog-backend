import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";
import hashPassword from "../reUses/hashPassword.js";
import comparePassword from "../reUses/comparePassword.js";
import isValidName from "../reUses/isValidName.js";

//  /manage-account-update/:id
export const manageAccountUpdate = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;

    let imageBuffer = null;
    let imageMimetype = null;

    if (req.file) {
      imageBuffer = req.file.buffer;
      imageMimetype = req.file.mimetype;
    }

    if (isValidEmailSyntax(data.email, next) || isValidName(data.name, next)) {
      return;
    } else if (data.password.includes(" ")) {
      console.error("Password should not include space");
      return constErr(400, "Password should not include space", next);
    }

    const user = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found.", next);
    }

    //  Check if data is already up-to-date
    const filteredUser = {
      name: user.name,
      email: user.email,
    };
    const sanitizedData = {
      ...data,
    };
    if (imageBuffer && imageMimetype) {
      filteredUser.buffer = user.buffer;
      filteredUser.mimetype = user.mimetype;
      sanitizedData.buffer = imageBuffer;
      sanitizedData.mimetype = imageMimetype;
    }

    delete sanitizedData.password; //  since we know the password is correct
    const isEqual = Object.keys(sanitizedData).every((key) => {
      if (key === "buffer") {
        console.log("there is buffer on req");
        const filteredBuffer = filteredUser.buffer
          ? Buffer.isBuffer(filteredUser.buffer)
            ? filteredUser.buffer
            : Buffer.from(filteredUser.buffer, "base64")
          : null;

        const sanitizedBuffer = sanitizedData.buffer || Buffer.alloc(0);

        return Buffer.compare(filteredBuffer, sanitizedBuffer) === 0;
      }
      return filteredUser[key] === sanitizedData[key];
    });

    if (isEqual) {
      console.log("Already up-to-date");
      return res.status(200).json({
        mssg: "Your data is already up-to-date.",
      });
    }

    const hashedPassword = await hashPassword(data.password);

    const updateFields = {
      ...data,
      password: hashedPassword,
      updatedAt: new Date(),
    };
    if (imageBuffer && imageMimetype) {
      updateFields.buffer = imageBuffer;
      updateFields.mimetype = imageMimetype;
    }

    const update = await req.db.collection("users").updateOne(
      { _id: ObjectId.createFromHexString(id) },
      {
        $set: updateFields,
      }
    );

    if (update.modifiedCount > 0) {
      console.log(`user:"${id}" updated data`);
      return res.status(201).end();
    } else {
      return constErr(400, "Failed to update the user", next);
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return next(new Error());
  }
};

//  like dislike comment view
export const likeDislike = async (req, res, next) => {
  const { action, userId } = req.body;
  const { postId } = req.params;
  const postIdObject = ObjectId.createFromHexString(postId);

  try {
    const post = await req.db.collection("blogs").findOne({
      _id: postIdObject,
    });
    if (!post) return constErr(404, "Post not found", next);

    switch (action) {
      case "addLike":
        await req.db
          .collection("blogs")
          .updateOne({ _id: postIdObject }, { $addToSet: { likes: userId } });
        return res.end();

      case "removeLike":
        await req.db.collection("blogs").updateOne(
          { _id: postIdObject },
          {
            $pull: { likes: userId },
          }
        );
        return res.end();

      case "addDislike":
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: ObjectId.createFromHexString(postId) },
            { $addToSet: { dislikes: userId } }
          );
        return res.end();

      case "removeDislike":
        await req.db
          .collection("blogs")
          .updateOne({ _id: postIdObject }, { $pull: { dislikes: userId } });
        return res.end();
      case "addView":
        await req.db
          .collection("blogs")
          .updateOne({ _id: postIdObject }, { $addToSet: { views: userId } });
        return res.end();
      case "comment":
        const commentData = {
          commenterId: userId,
          comment: req.body.comment,
          at: new Date(),
        };
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: postIdObject },
            { $push: { comments: commentData } }
          );
        return res.end();
    }
  } catch (error) {
    return next(new Error());
  }
};
