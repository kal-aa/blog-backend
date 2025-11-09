import { NextFunction } from "express";
declare function isInvalidName(name: string, next: NextFunction): boolean;
export default isInvalidName;
