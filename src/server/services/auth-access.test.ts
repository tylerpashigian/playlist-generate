import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthAccessState } from './auth-access'

const prismaMocks = vi.hoisted(() => ({
  accountFindFirst: vi.fn(),
}))

vi.mock('@/db', () => ({
  prisma: {
    account: {
      findFirst: prismaMocks.accountFindFirst,
    },
  },
}))

describe('getAuthAccessState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows verified password users', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue({ id: 'account-id' })

    await expect(
      getAuthAccessState({ emailVerified: true, userId: 'user-id' }),
    ).resolves.toEqual({
      canUseApp: true,
      hasPasswordLogin: true,
      requiresEmailVerification: false,
    })
  })

  it('blocks unverified password users', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue({ id: 'account-id' })

    await expect(
      getAuthAccessState({ emailVerified: false, userId: 'user-id' }),
    ).resolves.toEqual({
      canUseApp: false,
      hasPasswordLogin: true,
      requiresEmailVerification: true,
    })
  })

  it('allows unverified social-only users', async () => {
    prismaMocks.accountFindFirst.mockResolvedValue(null)

    await expect(
      getAuthAccessState({ emailVerified: false, userId: 'user-id' }),
    ).resolves.toEqual({
      canUseApp: true,
      hasPasswordLogin: false,
      requiresEmailVerification: false,
    })
  })
})
