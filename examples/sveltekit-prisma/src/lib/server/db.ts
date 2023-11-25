import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

if (false) {
  prisma.account
    .findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: '1',
        },
      },
      include: {
        user: true,
      },
    })
    .then((a) => {
      a?.user_id
    })
  prisma.session
    .create({
      data: {
        id: crypto.randomUUID(),
        user_id: '1',
        expires: 123,
      },
    })
    .then((sess) => {
      sess
    })

  const a = await prisma.account.findFirst()
  a?.user_id
}
