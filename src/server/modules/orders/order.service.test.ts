import { describe, expect, it } from 'vitest'
import { normalizeWhatsapp } from '@/lib/services/orders'
import { TooManyRequestsError } from '@/src/server/http/errors'

describe('order service invariants', () => {
  it('normalizes whatsapp numbers into E.164', () => {
    expect(
      normalizeWhatsapp({
        whatsapp_prefix: '+258',
        whatsapp_number: '84 123 4567',
      })
    ).toBe('+258841234567')
  })

  it('rejects invalid whatsapp payloads', () => {
    expect(() =>
      normalizeWhatsapp({
        whatsapp_prefix: '+258',
        whatsapp_number: '12',
      })
    ).toThrow('Invalid phone number length')
  })

  it('exposes a typed 429 error for throttled public flows', () => {
    const error = new TooManyRequestsError('Too many requests. Please try again later.')
    expect(error.statusCode).toBe(429)
  })
})
