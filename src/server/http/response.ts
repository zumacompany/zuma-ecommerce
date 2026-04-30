import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'

  return NextResponse.json({ error: message }, { status: 500 })
}
