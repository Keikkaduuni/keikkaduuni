-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "palveluId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hours" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "paymentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "paymentAmount" REAL,
    "paymentMethod" TEXT,
    "stripePaymentId" TEXT,
    "commissionAmount" REAL,
    "providerAmount" REAL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_palveluId_fkey" FOREIGN KEY ("palveluId") REFERENCES "Palvelu" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "date", "hours", "id", "isRead", "palveluId", "paymentCompleted", "status", "userId") SELECT "createdAt", "date", "hours", "id", "isRead", "palveluId", "paymentCompleted", "status", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE TABLE "new_Palvelu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "location" TEXT,
    "price" REAL,
    "unit" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "availability" TEXT,
    "tags" TEXT,
    "requirements" TEXT,
    "cancellationPolicy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Palvelu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Palvelu" ("category", "createdAt", "description", "id", "location", "photoUrl", "price", "title", "unit", "updatedAt", "userId") SELECT "category", "createdAt", "description", "id", "location", "photoUrl", "price", "title", "unit", "updatedAt", "userId" FROM "Palvelu";
DROP TABLE "Palvelu";
ALTER TABLE "new_Palvelu" RENAME TO "Palvelu";
CREATE TABLE "new_Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "palveluId" INTEGER,
    "tarveId" INTEGER,
    "userId" TEXT,
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "Report_palveluId_fkey" FOREIGN KEY ("palveluId") REFERENCES "Palvelu" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_tarveId_fkey" FOREIGN KEY ("tarveId") REFERENCES "Tarve" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "id", "palveluId", "reason", "tarveId", "userId") SELECT "createdAt", "id", "palveluId", "reason", "tarveId", "userId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "palveluId" INTEGER,
    "bookingId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "response" TEXT,
    CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_palveluId_fkey" FOREIGN KEY ("palveluId") REFERENCES "Palvelu" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("comment", "createdAt", "id", "rating", "reviewerId", "userId") SELECT "comment", "createdAt", "id", "rating", "reviewerId", "userId" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE TABLE "new_Tarve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "location" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "budget" REAL,
    "budgetType" TEXT,
    "budgetMin" REAL,
    "budgetMax" REAL,
    "timeline" TEXT,
    "preferredDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalOffers" INTEGER NOT NULL DEFAULT 0,
    "acceptedOfferId" INTEGER,
    "tags" TEXT,
    "requirements" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Tarve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tarve" ("category", "createdAt", "description", "id", "location", "photoUrl", "title", "updatedAt", "userId") SELECT "category", "createdAt", "description", "id", "location", "photoUrl", "title", "updatedAt", "userId" FROM "Tarve";
DROP TABLE "Tarve";
ALTER TABLE "new_Tarve" RENAME TO "Tarve";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "profilePhoto" TEXT,
    "description" TEXT,
    "skills" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'dual',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDocument" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_User" ("companyName", "createdAt", "description", "email", "id", "name", "password", "profilePhoto", "skills", "updatedAt") SELECT "companyName", "createdAt", "description", "email", "id", "name", "password", "profilePhoto", "skills", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
