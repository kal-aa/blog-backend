import { ObjectId } from "mongodb";
import constErr from "../reUses/constErr.js";

//  /manage-account-delete/:id
export const manageAccountDelete = async (req, res, next) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    console.error("Invalid id");
  }
  try {
    const result = await req.db
      .collection("users")
      .deleteOne({ _id: ObjectId.createFromHexString(id) });

    if (result.acknowledged === true) {
      if (result.deletedCount === 0) {
        console.log("No document exists to be deleted.");
        return constErr(
          404,
          "No document was deleted, possibly because it didn't exist.",
          next
        );
      } else {
        console.log("Document successfully deleted.");
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
