import { NextFunction } from "express";
import { CustomError } from "../types/miscellaneous.js";

function constErr(status: number, message: string, next: NextFunction) {
  const err: CustomError = new Error(message);
  err.status = status;
  next(err);
}

export default constErr;
