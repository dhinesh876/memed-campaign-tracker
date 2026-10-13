import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { HttpError } from '../utils/errors';

/** Wraps an async handler so rejected promises reach the error middleware. */
export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err?.name === 'CastError') return res.status(400).json({ message: 'Invalid id or value format' });
  if (err?.code === 11000) return res.status(409).json({ message: 'Duplicate value: already exists' });
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
};
