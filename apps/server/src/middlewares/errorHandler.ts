import { Request, Response, NextFunction } from "express";

const PG_INVALID_UUID = "22P02";

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let message = err.isOperational ? err.message : "Internal Server Error";

    if (!err.isOperational && err.code === PG_INVALID_UUID) {
        statusCode = 400;
        message = "Invalid id format";
    }

    if (!err.isOperational) {
        console.error("Unexpected Error...", err);
    }

    const response: Record<string, any> = {
        success: false,
        message,
    };

    if (err.errors) {
        response.errors = err.errors;
    }

    if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

export default errorHandler;
