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

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db