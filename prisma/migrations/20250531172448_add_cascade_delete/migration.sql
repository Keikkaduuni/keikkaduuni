-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Palvelu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Palvelu_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Palvelu" ("contact", "description", "id", "title", "userId") SELECT "contact", "description", "id", "title", "userId" FROM "Palvelu";
DROP TABLE "Palvelu";
ALTER TABLE "new_Palvelu" RENAME TO "Palvelu";
CREATE TABLE "new_Tarve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Tarve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tarve" ("contact", "description", "id", "title", "userId") SELECT "contact", "description", "id", "title", "userId" FROM "Tarve";
DROP TABLE "Tarve";
ALTER TABLE "new_Tarve" RENAME TO "Tarve";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
