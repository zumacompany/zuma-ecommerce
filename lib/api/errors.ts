/**
 * Typed error classes for domain-specific exceptions.
 * Use these in service functions; route handlers catch and convert to API responses.
 */

export class AppError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429)
    this.name = 'TooManyRequestsError'
  }
}

export class InsufficientStockError extends AppError {
  constructor(offerId: string, available: number, requested: number) {
    super(
      `Insufficient stock for offer ${offerId}. Available: ${available}, Requested: ${requested}`,
      400
    )
    this.name = 'InsufficientStockError'
  }
}
