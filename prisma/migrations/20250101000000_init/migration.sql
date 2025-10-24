-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "uniqueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funds" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "resourceId" TEXT NOT NULL,
    "cf" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travels" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dates" TEXT,
    "destination" TEXT,
    "userId" UUID NOT NULL,

    CONSTRAINT "travels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "shown" BOOLEAN NOT NULL DEFAULT true,
    "userId" UUID NOT NULL,
    "travelId" UUID,
    "fundId" UUID,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uniqueId_key" ON "users"("uniqueId");

-- CreateIndex
CREATE INDEX "users_uniqueId_idx" ON "users"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "funds_resourceId_key" ON "funds"("resourceId");

-- CreateIndex
CREATE INDEX "funds_resourceId_idx" ON "funds"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "travels_requestId_key" ON "travels"("requestId");

-- CreateIndex
CREATE INDEX "travels_userId_idx" ON "travels"("userId");

-- CreateIndex
CREATE INDEX "travels_requestId_idx" ON "travels"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_travelId_key" ON "settings"("userId", "travelId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_fundId_key" ON "settings"("userId", "fundId");

-- CreateIndex
CREATE INDEX "settings_userId_idx" ON "settings"("userId");

-- AddForeignKey
ALTER TABLE "travels" ADD CONSTRAINT "travels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "travels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;