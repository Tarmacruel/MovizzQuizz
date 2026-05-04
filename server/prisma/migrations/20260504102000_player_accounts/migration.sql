-- Lightweight player accounts for reconnecting to active matches.
CREATE TABLE "PlayerAccount" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerAccountSession" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAccountSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerMatchSummary" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "sessionId" TEXT,
    "roomId" TEXT,
    "roomCode" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "matchName" TEXT,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "roundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMatchSummary_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Player" ADD COLUMN "accountId" TEXT;

CREATE UNIQUE INDEX "PlayerAccount_handle_key" ON "PlayerAccount"("handle");
CREATE UNIQUE INDEX "PlayerAccountSession_tokenHash_key" ON "PlayerAccountSession"("tokenHash");
CREATE UNIQUE INDEX "PlayerMatchSummary_accountId_sessionId_key" ON "PlayerMatchSummary"("accountId", "sessionId");
CREATE INDEX "Player_accountId_idx" ON "Player"("accountId");
CREATE INDEX "PlayerAccountSession_accountId_idx" ON "PlayerAccountSession"("accountId");
CREATE INDEX "PlayerAccountSession_expiresAt_idx" ON "PlayerAccountSession"("expiresAt");
CREATE INDEX "PlayerMatchSummary_accountId_idx" ON "PlayerMatchSummary"("accountId");
CREATE INDEX "PlayerMatchSummary_gameType_idx" ON "PlayerMatchSummary"("gameType");
CREATE INDEX "PlayerMatchSummary_finishedAt_idx" ON "PlayerMatchSummary"("finishedAt");

ALTER TABLE "Player" ADD CONSTRAINT "Player_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlayerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerAccountSession" ADD CONSTRAINT "PlayerAccountSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlayerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerMatchSummary" ADD CONSTRAINT "PlayerMatchSummary_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlayerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerMatchSummary" ADD CONSTRAINT "PlayerMatchSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerMatchSummary" ADD CONSTRAINT "PlayerMatchSummary_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
