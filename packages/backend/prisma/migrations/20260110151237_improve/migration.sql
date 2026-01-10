-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "invalidatedAt" TIMESTAMP(3),
ADD COLUMN     "invalidationReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "encryptionAuthTag" TEXT,
ADD COLUMN     "encryptionSalt" TEXT;

-- CreateTable
CREATE TABLE "oauth_handoffs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_handoffs_code_key" ON "oauth_handoffs"("code");

-- CreateIndex
CREATE INDEX "oauth_handoffs_code_idx" ON "oauth_handoffs"("code");

-- CreateIndex
CREATE INDEX "oauth_handoffs_expiresAt_idx" ON "oauth_handoffs"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_key" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_state_idx" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_expiresAt_idx" ON "oauth_states"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_isActive_idx" ON "sessions"("isActive");

-- AddForeignKey
ALTER TABLE "oauth_handoffs" ADD CONSTRAINT "oauth_handoffs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
