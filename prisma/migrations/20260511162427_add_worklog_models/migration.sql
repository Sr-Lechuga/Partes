-- CreateTable
CREATE TABLE "work_sessions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'mobile',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalHours" DECIMAL(5,2) NOT NULL,
    "normalHours" DECIMAL(5,2) NOT NULL,
    "extraHours" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'timer',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_log_history" (
    "id" TEXT NOT NULL,
    "workLogId" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_log_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_sessions_employeeId_companyId_idx" ON "work_sessions"("employeeId", "companyId");

-- CreateIndex
CREATE INDEX "work_logs_employeeId_companyId_date_idx" ON "work_logs"("employeeId", "companyId", "date");

-- CreateIndex
CREATE INDEX "work_log_history_workLogId_createdAt_idx" ON "work_log_history"("workLogId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_companyId_performedAt_idx" ON "audit_events"("companyId", "performedAt");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "work_sessions" ADD CONSTRAINT "work_sessions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_log_history" ADD CONSTRAINT "work_log_history_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "work_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
