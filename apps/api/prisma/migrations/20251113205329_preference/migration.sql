-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "author" TEXT;

-- CreateTable
CREATE TABLE "news_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredAuthors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_preference_userId_key" ON "news_preference"("userId");

-- AddForeignKey
ALTER TABLE "news_preference" ADD CONSTRAINT "news_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
