import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('public order access tokens', () => {
  beforeEach(() => {
    process.env.ORDER_PUBLIC_TOKEN_SECRET = 'unit-test-order-secret'
    vi.resetModules()
  })

  it('creates verifiable tokens for public order access', async () => {
    const {
      buildPublicOrderSuccessPath,
      createPublicOrderAccessToken,
      verifyPublicOrderAccessToken,
    } = await import('@/src/server/modules/orders/order-access.policy')

    const token = createPublicOrderAccessToken({
      orderId: '11111111-1111-4111-8111-111111111111',
      expiresAt: Date.now() + 60_000,
    })

    const payload = verifyPublicOrderAccessToken(token)

    expect(payload.orderId).toBe('11111111-1111-4111-8111-111111111111')
    expect(buildPublicOrderSuccessPath(token)).toBe(`/order/${encodeURIComponent(token)}/success`)
  })

  it('rejects tampered tokens', async () => {
    const {
      createPublicOrderAccessToken,
      verifyPublicOrderAccessToken,
    } = await import('@/src/server/modules/orders/order-access.policy')

    const token = createPublicOrderAccessToken({
      orderId: '11111111-1111-4111-8111-111111111111',
      expiresAt: Date.now() + 60_000,
    })

    const [payloadSegment, signatureSegment] = token.split('.')
    const tamperedSignature = `${signatureSegment.slice(0, -1)}${signatureSegment.endsWith('a') ? 'b' : 'a'}`

    expect(() => verifyPublicOrderAccessToken(`${payloadSegment}.${tamperedSignature}`)).toThrow('Invalid order access token')
  })

  it('rejects expired tokens', async () => {
    const {
      createPublicOrderAccessToken,
      verifyPublicOrderAccessToken,
    } = await import('@/src/server/modules/orders/order-access.policy')

    const token = createPublicOrderAccessToken({
      orderId: '11111111-1111-4111-8111-111111111111',
      expiresAt: Date.now() - 1_000,
    })

    expect(() => verifyPublicOrderAccessToken(token)).toThrow('Order access token expired')
  })
})
