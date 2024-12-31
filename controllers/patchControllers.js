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

    if (isValidEmailSyntax(data.email, next)) {
      return;
    } else if (isValidName(data.name, next)) {
      return;
    }

    const user = await req.db
      .collection("users")
      .findOne({ _id: ObjectId.createFromHexString(id) });

    if (!user) {
      console.error("User not found");
      return constErr(404, "User not found.", next);
    }

    try {
      await comparePassword(data.password, user.password);
    } catch (error) {
      if (error.message === "Incorrect password") {
        return constErr(400, "Incorrect password", next);
      }
    }

    const filteredUser = { name: user.name, email: user.email }; // temporarily for the checking process
    const sanitizedData = { ...data };
    delete sanitizedData.password; //  since we know the password is correct

    const isEqual = Object.keys(sanitizedData).every(
      (key) => filteredUser[key] === data[key]
    );

    if (isEqual) {
      console.log("Already up-to-date");
      return res.status(200).json({
        mssg: "No changes were made; data is already up-to-date.",
      });
    }

    const hashedPassword = await hashPassword(data.password);

    const update = await req.db.collection("users").updateOne(
      { _id: ObjectId.createFromHexString(id) },
      {
        $set: {
          ...data,
          password: hashedPassword,
          updatedAt: new Date(),
        },
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
