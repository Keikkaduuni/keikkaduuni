-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "palveluId" INTEGER NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_palveluId_fkey" FOREIGN KEY ("palveluId") REFERENCES "Palvelu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
