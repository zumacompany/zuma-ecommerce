import { NextResponse } from 'next/server'

/**
 * Standardized API response helpers.
 * Every route handler should use these instead of raw NextResponse.json().
 */

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function apiCreated<T>(data: T) {
  return apiSuccess(data, 201)
}

export function apiError(message: string, status = 500, details?: unknown) {
  const body: Record<string, unknown> = { error: message }
  if (details !== undefined) body.details = details
  return NextResponse.json(body, { status })
}

export function apiBadRequest(message: string, details?: unknown) {
  return apiError(message, 400, details)
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError(message, 401)
}

export function apiForbidden(message = 'Forbidden') {
  return apiError(message, 403)
}

export function apiNotFound(message = 'Not found') {
  return apiError(message, 404)
}

export function apiTooManyRequests(message = 'Too many requests') {
  return apiError(message, 429)
}
