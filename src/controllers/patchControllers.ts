import { ObjectId } from "mongodb";
import constErr from "../utility/constErr.js";
import isInvalidName from "../utility/isInvalidName.js";
import { validateContent } from "../utility/validateContent.js";
import { Blog, Comment, ReqResNext, User } from "../types/miscellaneous.js";

// PATCH /interaction/:postId
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

// PATCH patch-blog/:id
export const patchBlog: ReqResNext = async (req, res, next) => {
  const { blogId, title, body } = req.body;
  const { id } = req.params;
  const cleanBody = body?.trim();
  const cleanTitle = title?.trim();

  if (!id || !blogId || !cleanTitle || !cleanBody) {
    console.error("Invalid or missing ID, blogId, title, or body");
    return constErr(400, "Invalid or missing ID, blogId, title, or body", next);
  }

  if (!ObjectId.isValid(blogId) || !ObjectId.isValid(id))
    return constErr(400, "Invalid blogId or user ID", next);

  try {
    const result = validateContent(`${cleanTitle}. ${cleanBody}`, "blog");

    if (!result.valid) {
      console.error("inappropriate content detected");
      return constErr(400, result.mssg, next);
    }

    const db = req.db!;
    const updateResult = await db.collection("blogs").updateOne(
      {
        _id: new ObjectId(blogId),
        authorId: new ObjectId(id),
      },
      { $set: { title: cleanTitle, body: cleanBody, updatedAt: new Date() } }
    );

    if (updateResult.matchedCount === 0)
      return constErr(404, "Blog not found or you are not the author", next);

    res.status(200).json({ message: "Blog updated successfully." });
  } catch (error) {
    console.error("Error updating blog", error);
    return constErr(500, "Server error occurred during blog update", next);
  }
};

// PATCH /account/update/:id
export const accountUpdate: ReqResNext = async (req, res, next) => {
  const { id } = req.params;
  const { name, removeImage } = req.body;

  const db = req.db!;

  if (!id || isInvalidName(name, next)) return;
  const userObjectId = new ObjectId(id);

  try {
    const user = await db
      .collection<User>("users")
      .findOne({ _id: userObjectId });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found", next);
    }

    const imageBuffer = req.file?.buffer || null;
    const imageMimetype = req.file?.mimetype || null;

    // Determine update conditions
    const initialImageEmpty = !user.buffer || user.buffer.length === 0;
    const userRemovedImg = removeImage === "true";
    const userWantsToRemoveImage = !initialImageEmpty && userRemovedImg;
    const userAddedNewImage = !!imageBuffer;
    const userChangedName = name && user.name !== name;

    const shouldUpdate =
      userChangedName || userWantsToRemoveImage || userAddedNewImage;

    if (!shouldUpdate)
      return constErr(
        400,
        "No changes were made. Your data is already up to date.",
        next
      );

    const updateFields: Partial<User> = {
      name,
      updatedAt: new Date(),
    };

    let updateQuery: Record<string, any> = {};

    if (userAddedNewImage)
      updateQuery = {
        $set: {
          ...updateFields,
          buffer: imageBuffer,
          mimetype: imageMimetype,
        },
      };
    else if (userWantsToRemoveImage)
      updateQuery = {
        $unset: {
          buffer: "",
          mimetype: "",
        },
        $set: updateFields,
      };
    else updateQuery = { $set: updateFields };

    const updateResult = await db
      .collection<User>("users")
      .updateOne({ _id: new ObjectId(id) }, updateQuery);

    if (updateResult.modifiedCount === 0)
      return constErr(400, "Failed to update the user", next);

    res.status(200).json({ mssg: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return next(new Error("An error occurred while updating the user"));
  }
};
