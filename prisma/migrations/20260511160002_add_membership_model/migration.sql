-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'HR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memberships_companyId_status_idx" ON "memberships"("companyId", "status");

-- CreateIndex
CREATE INDEX "memberships_firebaseUid_idx" ON "memberships"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_companyId_firebaseUid_key" ON "memberships"("companyId", "firebaseUid");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
