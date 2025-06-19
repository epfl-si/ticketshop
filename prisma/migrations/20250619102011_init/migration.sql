-- CreateTable
CREATE TABLE "Funds" (
    "id" SERIAL NOT NULL,
    "resourceId" TEXT NOT NULL,
    "cf" TEXT NOT NULL,

    CONSTRAINT "Funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "sciper" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dfs" (
    "id" SERIAL NOT NULL,
    "requestID" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dates" TEXT NOT NULL,
    "destination" TEXT NOT NULL,

    CONSTRAINT "Dfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "dfId" INTEGER,
    "fundId" INTEGER,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FundsToUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FundsToUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DfsToUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DfsToUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DfsToFunds" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DfsToFunds_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funds_resourceId_key" ON "Funds"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_sciper_key" ON "Users"("sciper");

-- CreateIndex
CREATE INDEX "_FundsToUsers_B_index" ON "_FundsToUsers"("B");

-- CreateIndex
CREATE INDEX "_DfsToUsers_B_index" ON "_DfsToUsers"("B");

-- CreateIndex
CREATE INDEX "_DfsToFunds_B_index" ON "_DfsToFunds"("B");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_dfId_fkey" FOREIGN KEY ("dfId") REFERENCES "Dfs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Funds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FundsToUsers" ADD CONSTRAINT "_FundsToUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FundsToUsers" ADD CONSTRAINT "_FundsToUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DfsToUsers" ADD CONSTRAINT "_DfsToUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Dfs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DfsToUsers" ADD CONSTRAINT "_DfsToUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DfsToFunds" ADD CONSTRAINT "_DfsToFunds_A_fkey" FOREIGN KEY ("A") REFERENCES "Dfs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DfsToFunds" ADD CONSTRAINT "_DfsToFunds_B_fkey" FOREIGN KEY ("B") REFERENCES "Funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;