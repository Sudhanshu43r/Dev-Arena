
import type {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";

 export const asyncHandler = (requestHandler: RequestHandler):RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    }
}