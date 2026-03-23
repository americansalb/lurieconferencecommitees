-- CreateTable: device tokens for push notifications
CREATE TABLE IF NOT EXISTS "lcc_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ios',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lcc_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcc_devices_token_key" ON "lcc_devices"("token");

-- AddForeignKey
ALTER TABLE "lcc_devices" ADD CONSTRAINT "lcc_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "lcc_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
