import { NextFunction } from "express";
import constErr from "./constErr.js";

function isInvalidEmailSyntax(email: string, next: NextFunction) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValid = emailRegex.test(email);

  if (!isValid) {
    constErr(400, "Invalid email format. Please check and try again.", next);
    return true;
  }

  return false;
}

export default isInvalidEmailSyntax;
