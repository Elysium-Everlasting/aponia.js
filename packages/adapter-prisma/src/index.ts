import { PrismaClient } from '@prisma/client'

import { PrismaAdapter } from './prisma'

const prisma = new PrismaClient()

const adapter = new PrismaAdapter(Object.create(null), prisma)

adapter.prisma.account
adapter.prisma.session
adapter.prisma.user
