import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
export interface CustomError extends Error {
    status?: number;
    code?: string;
}
export type ErrorHandlerParams = (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export type ReqResNext = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
export interface ReqUser {
    uid: string;
    email: string;
    name: string;
}
export interface User {
    _id: ObjectId;
    uid: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt?: Date;
    buffer?: Buffer;
    mimetype?: string;
}
export interface Blog {
    _id: ObjectId;
    title: string;
    body: string;
    authorId: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    likes: ObjectId[];
    dislikes: ObjectId[];
    views: ObjectId[];
}
export interface Comment {
    _id: ObjectId;
    commenterId: ObjectId;
    blogId: ObjectId;
    comment: string;
    likes: ObjectId[];
    dislikes: ObjectId[];
    timeStamp: Date;
    buffer?: Buffer;
    mimetype?: string;
}
export interface Reply {
    _id: ObjectId;
    commentId: ObjectId;
    blogId: ObjectId;
    replierId: ObjectId;
    reply: string;
    timeStamp: Date;
    buffer?: Buffer;
    mimetype?: string;
}
