import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    message: err.message || '服务器内部错误',
  };

  if (err instanceof AppError) {
    res.status(err.statusCode).json(response);
    return;
  }

  console.error('Error:', err);
  res.status(500).json({
    ...response,
    message: '服务器内部错误',
  });
};

export { errorHandler, AppError };
