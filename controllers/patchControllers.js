import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";
import isValidEmailSyntax from "../reUses/isValidEmail.js";
import hashPassword from "../reUses/hashPassword.js";
import isValidName from "../reUses/isValidName.js";
import { Filter } from "bad-words";

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
        const filteredBuffer = filteredUser.buffer
          ? Buffer.isBuffer(filteredUser.buffer)
            ? filteredUser.buffer
            : Buffer.from(filteredUser.buffer, "base64")
          : Buffer.alloc(0);

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

    // Check if the the updated email address is already in use
    const checkEmail = await req.db
      .collection("users")
      .findOne({ email: data.email });
    if (checkEmail && checkEmail._id !== ObjectId.createFromHexString(id)) {
      console.error("Email already exists");
      return constErr(409, "Email address already in use.", next);
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

//  like dislike comment view reply
export const likeDislike = async (req, res, next) => {
  const { action, userId } = req.body;
  const { postId } = req.params;
  const postIdObject = ObjectId.createFromHexString(postId);

  console.log("hi");

  try {
    const blogPost = await req.db.collection("blogs").findOne({
      _id: postIdObject,
    });
    const commentPost = await req.db.collection("comments").findOne({
      _id: postIdObject,
    });
    const replyPost = await req.db
      .collection("comments")
      .findOne({ "replies._id": postIdObject });

    if (!blogPost && !commentPost && !replyPost)
      return constErr(404, "Post not found", next);

    switch (action) {
      case "addLike":
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: postIdObject },
            { $addToSet: { likes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "removeLike":
        await req.db.collection("blogs").updateOne(
          { _id: postIdObject },
          {
            $pull: { likes: ObjectId.createFromHexString(userId) },
          }
        );
        return res.end();

      case "addDislike":
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: ObjectId.createFromHexString(postId) },
            { $addToSet: { dislikes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "removeDislike":
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: postIdObject },
            { $pull: { dislikes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "addView":
        await req.db
          .collection("blogs")
          .updateOne(
            { _id: postIdObject },
            { $addToSet: { views: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "comment":
        const commentData = {
          blogId: ObjectId.createFromHexString(req.body.blogId),
          commenterId: ObjectId.createFromHexString(userId),
          comment: req.body.comment,
          timeStamp: new Date(),
          likes: [],
          dislikes: [],
          replies: [],
        };
        await req.db.collection("comments").insertOne(commentData);
        return res.end();

      case "addCommentLike":
        await req.db
          .collection("comments")
          .updateOne(
            { _id: postIdObject },
            { $addToSet: { likes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "removeCommentLike":
        await req.db.collection("comments").updateOne(
          { _id: postIdObject },
          {
            $pull: { likes: ObjectId.createFromHexString(userId) },
          }
        );
        return res.end();

      case "addCommentDislike":
        await req.db
          .collection("comments")
          .updateOne(
            { _id: ObjectId.createFromHexString(postId) },
            { $addToSet: { dislikes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "removeCommentDislike":
        await req.db
          .collection("comments")
          .updateOne(
            { _id: postIdObject },
            { $pull: { dislikes: ObjectId.createFromHexString(userId) } }
          );
        return res.end();

      case "reply":
        const replyData = {
          _id: new ObjectId(),
          replierId: ObjectId.createFromHexString(req.body.userId),
          reply: req.body.reply,
          timeStamp: new Date(),
        };
        await req.db
          .collection("comments")
          .updateOne(
            { _id: postIdObject },
            { $addToSet: { replies: replyData } }
          );
        return res.end();

      case "removeReply":
        const x = await req.db.collection("comments").updateOne(
          { "replies._id": postIdObject },
          {
            $pull: {
              replies: {
                _id: postIdObject,
              },
            },
          }
        );
        return res.end();
    }
  } catch (error) {
    return constErr(500, error, next);
  }
};

//  patch-blog/:id
export const patchBlog = async (req, res, next) => {
  const data = req.body;
  const { id } = req.params;

  try {
    //  check content
    const validateContent = (content) => {
      const filter = new Filter();
      if (filter.isProfane(content)) {
        return {
          valid: false,
          mssg: "Content contains inappropriate language",
        };
      }
      return { valid: true, mssg: "content is appropriate" };
    };

    const result = validateContent(`${data.title}, ${data.body}`);

    if (!ObjectId.isValid(data.blogId) && !ObjectId.isValid(id)) {
      return constErr(400, "Please login or signup again", next);
    }

    await req.db.collection("blogs").updateOne(
      {
        _id: ObjectId.createFromHexString(data.blogId),
        authorId: ObjectId.createFromHexString(id),
      },
      { $set: { title: data.title, body: data.body, updatedAt: new Date() } }
    );
    if (!result.valid) {
      console.error("inappropriate content");
      return constErr(400, result.mssg, next);
    }
    res.end();
  } catch (error) {
    console.error("Error updating blog", error);
    return next(new Error("An error occurred while updating the blog"));
  }
};
