-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Palvelu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Palvelu" ("category", "description", "id", "location", "photoUrl", "price", "title", "unit", "userId") SELECT "category", "description", "id", "location", "photoUrl", "price", "title", "unit", "userId" FROM "Palvelu";
DROP TABLE "Palvelu";
ALTER TABLE "new_Palvelu" RENAME TO "Palvelu";
CREATE TABLE "new_Tarve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "location" TEXT,
    "photoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Tarve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tarve" ("category", "description", "id", "location", "photoUrl", "title", "userId") SELECT "category", "description", "id", "location", "photoUrl", "title", "userId" FROM "Tarve";
DROP TABLE "Tarve";
ALTER TABLE "new_Tarve" RENAME TO "Tarve";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
