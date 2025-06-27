/*
  Warnings:

  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phoneVerified` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "profilePhoto" TEXT,
    "description" TEXT,
    "skills" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'dual',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDocument" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "rating" REAL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("bio", "companyName", "completedJobs", "createdAt", "description", "email", "emailVerified", "id", "isActive", "isVerified", "lastSeenAt", "name", "password", "profilePhoto", "rating", "role", "skills", "stripeAccountId", "totalEarnings", "totalReviews", "updatedAt", "verificationDocument") SELECT "bio", "companyName", "completedJobs", "createdAt", "description", "email", "emailVerified", "id", "isActive", "isVerified", "lastSeenAt", "name", "password", "profilePhoto", "rating", "role", "skills", "stripeAccountId", "totalEarnings", "totalReviews", "updatedAt", "verificationDocument" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
