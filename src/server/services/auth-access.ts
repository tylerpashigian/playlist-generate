import { prisma } from '@/db'

interface GetAuthAccessInput {
  emailVerified: boolean
  userId: string
}

export interface AuthAccessState {
  canUseApp: boolean
  hasPasswordLogin: boolean
  requiresEmailVerification: boolean
}

export async function getAuthAccessState({
  emailVerified,
  userId,
}: GetAuthAccessInput): Promise<AuthAccessState> {
  const passwordAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'credential',
      NOT: {
        password: null,
      },
    },
    select: {
      id: true,
    },
  })
  const hasPasswordLogin = Boolean(passwordAccount)

  return {
    canUseApp: emailVerified || !hasPasswordLogin,
    hasPasswordLogin,
    requiresEmailVerification: !emailVerified && hasPasswordLogin,
  }
}
