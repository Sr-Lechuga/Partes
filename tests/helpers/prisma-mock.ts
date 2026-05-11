/**
 * Prisma Mock Helper
 *
 * This module provides a mocked PrismaClient for unit testing.
 * It intercepts all Prisma method calls and lets you define
 * custom return values using Jest's .mockResolvedValue().
 *
 * Usage:
 *   1. Call jest.mock('@/lib/prisma') in your test file.
 *   2. Import prisma from '@/lib/prisma'.
 *   3. Cast it: const prismaMock = prisma as jest.Mocked<typeof prisma>;
 *   4. Define return values: (prismaMock.company.create as jest.Mock).mockResolvedValue(data);
 */

// This file is imported automatically when jest.mock('@/lib/prisma') is called
// because Jest hoists the mock and replaces the real module.

export {};
