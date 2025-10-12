import type { NextFunction, Request, Response } from 'express';
import type { ChatRequest } from '../types/index.js';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  code = 'VALIDATION_ERROR';
  details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.details = details;
  }
}

export const validateChatRequest = (req: Request, _res: Response, next: NextFunction): void => {
  const payload = req.body as Partial<ChatRequest>;
  const errors: ValidationErrorDetail[] = [];

  if (typeof payload.message !== 'string' || payload.message.trim().length === 0) {
    errors.push({
      field: 'message',
      message: 'Message is required and must be a non-empty string.',
    });
  } else if (payload.message.length > 2000) {
    errors.push({
      field: 'message',
      message: 'Message must be 2000 characters or fewer.',
    });
  }

  if (payload.experienceContext !== undefined) {
    if (typeof payload.experienceContext !== 'object' || payload.experienceContext === null) {
      errors.push({
        field: 'experienceContext',
        message: 'Experience context must be an object when provided.',
      });
    } else if (
      typeof payload.experienceContext.experienceId !== 'string' ||
      payload.experienceContext.experienceId.trim().length === 0
    ) {
      errors.push({
        field: 'experienceContext.experienceId',
        message: 'Experience ID must be a non-empty string when experience context is provided.',
      });
    }
  }

  if (payload.chipId !== undefined && typeof payload.chipId !== 'string') {
    errors.push({
      field: 'chipId',
      message: 'Chip ID must be a string when provided.',
    });
  }

  if (errors.length > 0) {
    next(new ValidationError('Invalid chat request payload.', errors));
    return;
  }

  next();
};
