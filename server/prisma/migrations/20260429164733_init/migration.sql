-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "hostSocketId" TEXT,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'playing',
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "deck" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questionId" TEXT,
    "selectedOption" TEXT,
    "correct" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 0,
    "secondsLeft" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_active_idx" ON "Question"("active");

-- CreateIndex
CREATE INDEX "Question_category_difficulty_idx" ON "Question"("category", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Player_roomId_idx" ON "Player"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_roomId_socketId_key" ON "Player"("roomId", "socketId");

-- CreateIndex
CREATE INDEX "GameSession_roomId_idx" ON "GameSession"("roomId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "GameAnswer_sessionId_idx" ON "GameAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "GameAnswer_playerId_idx" ON "GameAnswer"("playerId");

-- CreateIndex
CREATE INDEX "GameAnswer_questionId_idx" ON "GameAnswer"("questionId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnswer" ADD CONSTRAINT "GameAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnswer" ADD CONSTRAINT "GameAnswer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
