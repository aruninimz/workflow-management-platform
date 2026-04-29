import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle operational errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export class ApiError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message = 'Bad Request') => new ApiError(400, message),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message = 'Forbidden') => new ApiError(403, message),
  notFound: (message = 'Resource not found') => new ApiError(404, message),
  conflict: (message = 'Conflict') => new ApiError(409, message),
  internal: (message = 'Internal Server Error') => new ApiError(500, message, false),
};
