-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");
