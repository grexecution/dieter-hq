/**
 * API Error handling utilities
 * 
 * Provides standardized error responses and error handling for API routes
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ApiErrors = {
  BadRequest: (message = 'Bad request') => new ApiError(400, message, 'BAD_REQUEST'),
  Unauthorized: (message = 'Unauthorized') => new ApiError(401, message, 'UNAUTHORIZED'),
  Forbidden: (message = 'Forbidden') => new ApiError(403, message, 'FORBIDDEN'),
  NotFound: (message = 'Not found') => new ApiError(404, message, 'NOT_FOUND'),
  Conflict: (message = 'Conflict') => new ApiError(409, message, 'CONFLICT'),
  ValidationError: (message = 'Validation error') => new ApiError(422, message, 'VALIDATION_ERROR'),
  InternalServerError: (message = 'Internal server error') => new ApiError(500, message, 'INTERNAL_ERROR'),
  ServiceUnavailable: (message = 'Service unavailable') => new ApiError(503, message, 'SERVICE_UNAVAILABLE'),
};

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return Response.json(
      {
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : error.message,
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }

  return Response.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
