import { NextFunction, Request, Response } from "express";
export interface CustomError extends Error {
    status?: number;
    code?: string;
}
export type ErrorHandlerParams = (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export type ReqResNext = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export interface ReqUser {
    uid: string;
    email: string;
    name: string;
}
export interface User {
    uid: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt?: Date;
    buffer?: Buffer;
    mimetype?: string;
}
