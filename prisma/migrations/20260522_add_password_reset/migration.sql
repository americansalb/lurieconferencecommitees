-- CreateTable: password reset tokens for user-initiated and admin-initiated resets
CREATE TABLE IF NOT EXISTS "lcc"."lcc_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "lcc_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lcc_password_reset_tokens_token_key" ON "lcc"."lcc_password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "lcc_password_reset_tokens_userId_idx" ON "lcc"."lcc_password_reset_tokens"("userId");
