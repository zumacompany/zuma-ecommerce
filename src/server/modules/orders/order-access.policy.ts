import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { UnauthorizedError } from '@/src/server/http/errors'
import { getOrderPublicTokenSecret } from '@/src/server/platform/config/env'
import {
  PUBLIC_ORDER_ACCESS_TOKEN_TTL_MS,
  PUBLIC_ORDER_ACCESS_TOKEN_VERSION,
  PublicOrderAccessTokenPayloadSchema,
  type PublicOrderAccessTokenPayload,
} from './order-public.schemas'

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url')
}

function signPayloadSegment(payloadSegment: string) {
  return createHmac('sha256', getOrderPublicTokenSecret())
    .update(payloadSegment)
    .digest()
}

export function createPublicOrderAccessToken(input: {
  orderId: string
  expiresAt?: number
}) {
  const payload = {
    v: PUBLIC_ORDER_ACCESS_TOKEN_VERSION,
    orderId: input.orderId,
    exp: input.expiresAt ?? Date.now() + PUBLIC_ORDER_ACCESS_TOKEN_TTL_MS,
  }

  const payloadSegment = encodeBase64Url(JSON.stringify(payload))
  const signatureSegment = encodeBase64Url(signPayloadSegment(payloadSegment))

  return `${payloadSegment}.${signatureSegment}`
}

export function verifyPublicOrderAccessToken(token: string): PublicOrderAccessTokenPayload {
  const [payloadSegment, signatureSegment, ...rest] = token.split('.')

  if (!payloadSegment || !signatureSegment || rest.length > 0) {
    throw new UnauthorizedError('Invalid order access token')
  }

  const actualSignature = decodeBase64Url(signatureSegment)
  const expectedSignature = signPayloadSegment(payloadSegment)

  if (
    actualSignature.length !== expectedSignature.length
    || !timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw new UnauthorizedError('Invalid order access token')
  }

  let rawPayload: unknown

  try {
    rawPayload = JSON.parse(decodeBase64Url(payloadSegment).toString('utf8'))
  } catch {
    throw new UnauthorizedError('Invalid order access token')
  }

  let payload: PublicOrderAccessTokenPayload

  try {
    payload = PublicOrderAccessTokenPayloadSchema.parse(rawPayload)
  } catch {
    throw new UnauthorizedError('Invalid order access token')
  }

  if (payload.exp <= Date.now()) {
    throw new UnauthorizedError('Order access token expired')
  }

  return payload
}

export function buildPublicOrderSuccessPath(accessToken: string) {
  return `/order/${encodeURIComponent(accessToken)}/success`
}
