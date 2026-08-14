import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const defaultDbPath = path.join(process.cwd(), 'prisma/dev.db')
let url = process.env.DATABASE_URL || `file:${defaultDbPath}`
if (url.startsWith('file:')) {
  const dbPath = url.replace('file:', '')
  if (!path.isAbsolute(dbPath)) {
    url = `file:${path.resolve(process.cwd(), dbPath)}`
  }
}
const adapter = new PrismaBetterSqlite3({ url })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
