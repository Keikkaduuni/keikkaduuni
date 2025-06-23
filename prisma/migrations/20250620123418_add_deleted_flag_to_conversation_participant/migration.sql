-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConversationParticipant" (
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastSeenAt" DATETIME,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("userId", "conversationId"),
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ConversationParticipant" ("conversationId", "lastSeenAt", "userId") SELECT "conversationId", "lastSeenAt", "userId" FROM "ConversationParticipant";
DROP TABLE "ConversationParticipant";
ALTER TABLE "new_ConversationParticipant" RENAME TO "ConversationParticipant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
