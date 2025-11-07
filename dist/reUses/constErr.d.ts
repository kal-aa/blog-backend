import { NextFunction } from "express";
declare function constErr(status: number, message: string, next: NextFunction): void;
export default constErr;
