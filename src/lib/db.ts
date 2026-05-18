import { PrismaClient } from '@prisma/client'

// Global BigInt JSON serialization polyfill
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  ;(BigInt.prototype as any).toJSON = function () {
    const num = Number(this)
    return Number.isSafeInteger(num) ? num : this.toString()
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let connectionUrl = process.env.DATABASE_URL;



export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: connectionUrl ? {
      db: {
        url: connectionUrl,
      },
    } : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db