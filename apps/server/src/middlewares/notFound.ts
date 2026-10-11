import { NextFunction, Response, Request } from "express";
import AppError from "../utils/AppError.js"

const notFound = (req: Request, _res: Response, next: NextFunction): void => {
    next(new AppError(`Route ${req.method} ${req.path} not found`, 404));
}

export default notFound;
