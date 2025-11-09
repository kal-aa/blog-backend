import { NextFunction } from "express";
declare function isInvalidEmailSyntax(email: string, next: NextFunction): boolean;
export default isInvalidEmailSyntax;
