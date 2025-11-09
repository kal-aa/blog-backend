import { ObjectId } from "mongodb";
import constErr from "../utility/constErr.js";
import isInvalidEmailSyntax from "../utility/isInvalidEmailSyntax.js";
import hashPassword from "../utility/hashPassword.js";
import isInvalidName from "../utility/isInvalidName.js";
import { Filter } from "bad-words";
import { validateContent } from "../utility/validateContent.js";
import { Blog, Comment, ReqResNext } from "../types/miscellaneous.js";

//  like dislike comment view reply
export const interaction: ReqResNext = async (req, res, next) => {
  const { action, userId } = req.body;
  const { postId } = req.params;

  if (!action || !userId || !postId) {
    return constErr(400, "Missing action, userId, or postId", next);
  }

  try {
    const db = req.db!;
    const userObjectId = new ObjectId(userId);
    const postObjectId = new ObjectId(postId.toString());

    const collections = ["blogs", "comments"];
    const results = await Promise.all(
      collections.map((c) => db.collection(c).findOne({ _id: postObjectId }))
    );

    if (!results.some((r) => r)) return constErr(404, "Post not found", next);

    switch (action) {
      case "addLike":
        await db
          .collection<Blog>("blogs")
          .updateOne(
            { _id: postObjectId },
            { $addToSet: { likes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "removeLike":
        await db.collection<Blog>("blogs").updateOne(
          { _id: postObjectId },
          {
            $pull: { likes: userObjectId },
          }
        );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "addDislike":
        await db
          .collection<Blog>("blogs")
          .updateOne(
            { _id: postObjectId },
            { $addToSet: { dislikes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "removeDislike":
        await db
          .collection<Blog>("blogs")
          .updateOne(
            { _id: postObjectId },
            { $pull: { dislikes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "addView":
        await db
          .collection<Blog>("blogs")
          .updateOne(
            { _id: postObjectId },
            { $addToSet: { views: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "addCommentLike":
        await db
          .collection<Comment>("comments")
          .updateOne(
            { _id: postObjectId },
            { $addToSet: { likes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "removeCommentLike":
        await db.collection<Comment>("comments").updateOne(
          { _id: postObjectId },
          {
            $pull: { likes: userObjectId },
          }
        );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "addCommentDislike":
        await db
          .collection<Comment>("comments")
          .updateOne(
            { _id: postObjectId },
            { $addToSet: { dislikes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;

      case "removeCommentDislike":
        await db
          .collection<Comment>("comments")
          .updateOne(
            { _id: postObjectId },
            { $pull: { dislikes: userObjectId } }
          );
        res.status(200).json({ message: `${action} applied successfully` });
        break;
      default:
        return constErr(400, "Invalid action", next);
    }
  } catch (error: any) {
    return constErr(500, error.message || "Error during patching", next);
  }
};

//  patch-blog/:id
// export const patchBlog = async (req, res, next) => {
//   const data = req.body;
//   const { id } = req.params;

//   try {
//     const result = validateContent(`${data.title}, ${data.body}`, "blog");

//     if (!result.valid) {
//       console.error("inappropriate content");
//       return constErr(400, result.mssg, next);
//     }

//     if (!ObjectId.isValid(data.blogId) && !ObjectId.isValid(id)) {
//       return constErr(400, "Please login or signup again", next);
//     }

//     await req.db.collection("blogs").updateOne(
//       {
//         _id: ObjectId.createFromHexString(data.blogId),
//         authorId: ObjectId.createFromHexString(id),
//       },
//       { $set: { title: data.title, body: data.body, updatedAt: new Date() } }
//     );

//     res.end();
//   } catch (error) {
//     console.error("Error updating blog", error);
//     return next(new Error("An error occurred while updating the blog"));
//   }
// };

//  /account/update/:id
// export const accountUpdate = async (req, res, next) => {
//   const { id } = req.params;
//   const { name, removeImage } = req.body;

//   try {
//     let imageBuffer = null;
//     let imageMimetype = null;

//     if (req.file) {
//       imageBuffer = req.file.buffer;
//       imageMimetype = req.file.mimetype;
//     }

//     if (isInvalidName(name, next)) {
//       return;
//     }

//     const user = await req.db
//       .collection("users")
//       .findOne({ _id: new ObjectId(id) });

//     if (!user) {
//       console.error("User not found");
//       return constErr(404, "User not found", next);
//     }

//     //  Check if data is already up-to-date
//     const filteredUser = {
//       name: user.name,
//     };
//     const sanitizedUser = {
//       name: name,
//     };

//     if (imageBuffer && imageMimetype) {
//       filteredUser.buffer = user.buffer;
//       filteredUser.mimetype = user.mimetype;
//       sanitizedUser.buffer = imageBuffer;
//       sanitizedUser.mimetype = imageMimetype;
//     }

//     const isEqual = Object.keys(sanitizedUser).every((key) => {
//       if (key === "buffer") {
//         const filteredBuffer = filteredUser.buffer
//           ? Buffer.isBuffer(filteredUser.buffer)
//             ? filteredUser.buffer
//             : Buffer.from(filteredUser.buffer, "base64")
//           : Buffer.alloc(0);

//         const sanitizedBuffer = sanitizedUser.buffer || Buffer.alloc(0);

//         return Buffer.compare(filteredBuffer, sanitizedBuffer) === 0;
//       }
//       return filteredUser[key] === sanitizedUser[key];
//     });

//     const initialImageEmpty = !user.buffer || user.buffer.length === 0;
//     const userRemovedImg = removeImage === "true";

//     const userWantsToRemoveImage = !initialImageEmpty && userRemovedImg;
//     const userAddedNewImage = !initialImageEmpty && imageBuffer;
//     const userChangedTestInfo = !isEqual;

//     const shouldUpdate =
//       userChangedTestInfo || userWantsToRemoveImage || userAddedNewImage;

//     if (!shouldUpdate) {
//       console.log("Already up-to-date");
//       return res.status(200).json({
//         mssg: "No changes were made. Your data is already up to date.",
//       });
//     }

//     const updateFields = {
//       name: name,
//       updatedAt: new Date(),
//     };

//     if ((imageBuffer && imageMimetype) || userRemovedImg) {
//       (updateFields.buffer = imageBuffer),
//         (updateFields.mimetype = imageMimetype);
//     }

//     const update = await req.db.collection("users").updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: updateFields,
//       }
//     );

//     if (update.modifiedCount > 0) {
//       return res.status(201).json({ mssg: "User updated successfully" });
//     } else {
//       return constErr(400, "Failed to update the user", next);
//     }
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return next(new Error());
//   }
// };
