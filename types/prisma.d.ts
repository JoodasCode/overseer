declare module '@/lib/db/prisma' {
  import { PrismaClient } from '@prisma/client';
  
  /**
   * Extended PrismaClient with custom methods
   */
  export interface ExtendedPrismaClient extends PrismaClient {
    // Add any custom methods or extensions here
  }
  
  /**
   * Singleton instance of the Prisma client
   */
  export const prisma: ExtendedPrismaClient;
  export default prisma;
}
