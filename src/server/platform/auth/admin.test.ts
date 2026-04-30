import { describe, expect, it } from 'vitest'
import { isAdminUser } from '@/src/server/platform/auth/admin-role'

describe('isAdminUser', () => {
  it('accepts role-based admins', () => {
    expect(
      isAdminUser({
        id: '1',
        app_metadata: { role: 'admin' },
        user_metadata: {},
        email: 'admin@example.com',
      })
    ).toBe(true)
  })

  it('accepts roles array admins', () => {
    expect(
      isAdminUser({
        id: '1',
        app_metadata: { roles: ['editor', 'admin'] },
        user_metadata: {},
        email: 'admin@example.com',
      })
    ).toBe(true)
  })

  it('rejects non-admin users', () => {
    expect(
      isAdminUser({
        id: '1',
        app_metadata: { role: 'customer' },
        user_metadata: {},
        email: 'user@example.com',
      })
    ).toBe(false)
  })
})
