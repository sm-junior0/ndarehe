import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../types';

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Improve Prisma error messaging, especially for schema mismatches (e.g., P2022)
    let message = 'Database operation failed';
    let statusCode = 400;

    // P2022: Column does not exist (most common when Prisma schema was updated but DB wasn't migrated)
    if ((err as any).code === 'P2022') {
      message = 'Database schema is out of date. Please run "npm run db:push" (development) or apply migrations to add missing columns.';
      statusCode = 500;
    }

    error = { message, statusCode } as AppError;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = 'Invalid data provided';
    error = { message, statusCode: 400 } as AppError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 } as AppError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 } as AppError;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const message = 'File upload error';
    error = { message, statusCode: 400 } as AppError;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 } as AppError;
  }

  // Cast errors
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 } as AppError;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
}; 