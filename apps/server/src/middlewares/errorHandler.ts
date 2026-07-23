import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : "Internal Server Error";

    if (!err.isOperational) {
        console.error("Unexpected Error...", err);
    }

    const response: { success: boolean, message: string, stack?: string } = {
        success: false,
        message
    };

    if (process.env.NODE_DEV == "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

export default errorHandler;

