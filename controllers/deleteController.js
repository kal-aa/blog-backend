import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";

//  delete-comment/:id
export const deleteComment = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!ObjectId.isValid(id)) {
      console.error("Invalid id");
      return constErr(400, "Please login or signup again", next);
    }

    await req.db.collection("comments").deleteOne({ _id: new ObjectId(id) });

    res.end();
  } catch (error) {
    console.error("Error deleting comment");
  }
};

//  delete-reply/:id
export const deleteReply = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!ObjectId.isValid(id)) {
      console.error("Invalid id");
      return constErr(400, "Please login or signup again", next);
    }

    await req.db.collection("replies").deleteOne({ _id: new ObjectId(id) });

    res.end();
  } catch (error) {
    console.error("Error deleting comment");
  }
};

//  /delete-blog/:id
export const deleteBlog = async (req, res, next) => {
  const id = req.params.id;
  const { blogId } = req.query;

  if (!ObjectId.isValid(id) || !ObjectId.isValid(blogId)) {
    console.error("invalid id");
    return constErr(
      400,
      "Please login or signup again!, just click the logo",
      next
    );
  }
  await req.db
    .collection("replies")
    .deleteMany({ blogId: ObjectId.createFromHexString(blogId) });
  await req.db
    .collection("comments")
    .deleteMany({ blogId: ObjectId.createFromHexString(blogId) });
  await req.db
    .collection("blogs")
    .deleteOne({ _id: ObjectId.createFromHexString(blogId) });

  res.end();
};

//  /account/delete/:id
export const accountDelete = async (req, res, next) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    console.error("Invalid id");
    return constErr(500, "Please log in again, click the Logo", next);
  }
  try {
    req.db
      .collection("comments")
      .updateMany(
        { "replies.replierId": ObjectId.createFromHexString(id) },
        { $pull: { replies: { replierId: ObjectId.createFromHexString(id) } } }
      );
    await req.db
      .collection("comments")
      .deleteMany({ commenterId: ObjectId.createFromHexString(id) });
    await req.db
      .collection("blogs")
      .deleteOne({ authorId: ObjectId.createFromHexString(id) });
    const deleteUserResult = await req.db
      .collection("users")
      .deleteOne({ _id: ObjectId.createFromHexString(id) });

    if (deleteUserResult.acknowledged === true) {
      if (deleteUserResult.deletedCount === 0) {
        console.log("No document exists to be deleted.");
        return constErr(
          404,
          "No document was deleted, possibly because it didn't exist.",
          next
        );
      } else {
        console.log("user successfully deleted.");
        res.end();
      }
    } else {
      console.log("The delete operation was not acknowledged.");
      return next(new Error());
    }
  } catch (error) {
    console.error("Error during delete operation:", error);
    return next(new Error());
  }
};
