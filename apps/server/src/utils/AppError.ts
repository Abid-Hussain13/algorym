export interface ValidationError {
  field: string;
  message: string;
}

class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: ValidationError[];

  constructor(message: string, statusCode: number, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
