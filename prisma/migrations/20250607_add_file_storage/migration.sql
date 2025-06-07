-- CreateTable
CREATE TABLE "File" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "url" TEXT,
  "provider" TEXT NOT NULL,
  "ownerId" UUID NOT NULL,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "File_ownerId_idx" ON "File"("ownerId");

-- CreateIndex
CREATE INDEX "File_mimeType_idx" ON "File"("mimeType");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
