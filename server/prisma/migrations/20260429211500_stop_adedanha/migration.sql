-- Add game type support to existing multiplayer rooms.
ALTER TABLE "Room" ADD COLUMN "gameType" TEXT NOT NULL DEFAULT 'quiz';
ALTER TABLE "GameSession" ADD COLUMN "gameType" TEXT NOT NULL DEFAULT 'quiz';
ALTER TABLE "GameSession" ADD COLUMN "settings" JSONB;
ALTER TABLE "GameSession" ADD COLUMN "history" JSONB;

-- Prepare normalized persistence for Stop / Adedanha rounds.
CREATE TABLE "StopRound" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "sessionId" TEXT,
    "roundNumber" INTEGER NOT NULL,
    "letter" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'stop-playing',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "stoppedByPlayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StopCategory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "sessionId" TEXT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StopAnswer" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "autoValid" BOOLEAN NOT NULL DEFAULT false,
    "hostValid" BOOLEAN,
    "unique" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopAnswer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Room_gameType_idx" ON "Room"("gameType");
CREATE INDEX "GameSession_gameType_idx" ON "GameSession"("gameType");
CREATE INDEX "StopRound_roomId_idx" ON "StopRound"("roomId");
CREATE INDEX "StopRound_sessionId_idx" ON "StopRound"("sessionId");
CREATE INDEX "StopRound_status_idx" ON "StopRound"("status");
CREATE INDEX "StopCategory_roomId_idx" ON "StopCategory"("roomId");
CREATE INDEX "StopCategory_sessionId_idx" ON "StopCategory"("sessionId");
CREATE INDEX "StopAnswer_roundId_idx" ON "StopAnswer"("roundId");
CREATE INDEX "StopAnswer_playerId_idx" ON "StopAnswer"("playerId");
CREATE INDEX "StopAnswer_categoryId_idx" ON "StopAnswer"("categoryId");

ALTER TABLE "StopRound" ADD CONSTRAINT "StopRound_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StopRound" ADD CONSTRAINT "StopRound_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StopCategory" ADD CONSTRAINT "StopCategory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StopCategory" ADD CONSTRAINT "StopCategory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StopAnswer" ADD CONSTRAINT "StopAnswer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "StopRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StopAnswer" ADD CONSTRAINT "StopAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StopAnswer" ADD CONSTRAINT "StopAnswer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StopCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
