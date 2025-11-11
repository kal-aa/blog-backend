import { NextFunction } from "express";
import constErr from "./constErr.js";

function isInvalidName(name: string, next: NextFunction) {
  const nameRegex = /^[\p{L}\s]+$/u;
  const isValid = nameRegex.test(name.replace(/\s+/g, ""));

  if (!isValid) {
    constErr(
      400,
      "Name can only contain letters, no symbols or characters are allowed.",
      next
    );
    return true;
  }

  return false;
}

export default isInvalidName;
