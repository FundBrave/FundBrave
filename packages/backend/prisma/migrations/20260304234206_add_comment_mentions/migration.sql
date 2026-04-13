/*
  Warnings:

  - You are about to drop the column `search_vector` on the `fundraisers` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `search_queries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `search_suggestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "search_queries" DROP CONSTRAINT "search_queries_user_id_fkey";

-- DropIndex
DROP INDEX "fundraisers_categories_idx";

-- DropIndex
DROP INDEX "fundraisers_name_trgm_idx";

-- DropIndex
DROP INDEX "fundraisers_search_vector_idx";

-- DropIndex
DROP INDEX "hashtags_tag_trgm_idx";

-- DropIndex
DROP INDEX "posts_search_vector_idx";

-- DropIndex
DROP INDEX "trending_type_score_idx";

-- DropIndex
DROP INDEX "users_displayName_trgm_idx";

-- DropIndex
DROP INDEX "users_search_vector_idx";

-- DropIndex
DROP INDEX "users_username_trgm_idx";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "fundraiserId" TEXT,
ADD COLUMN     "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "fundraisers" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "search_vector";

-- DropTable
DROP TABLE "search_queries";

-- DropTable
DROP TABLE "search_suggestions";

-- CreateIndex
CREATE INDEX "comments_fundraiserId_idx" ON "comments"("fundraiserId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "fundraisers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
