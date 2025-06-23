/*
  Warnings:

  - You are about to drop the `_ConversationParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ConversationParticipants";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "conversationId"),
    CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
