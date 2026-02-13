-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PDF', 'MARKDOWN', 'TEXT', 'AUDIO', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('PODCAST', 'VIDEO', 'QA_SET', 'FLASHCARD_SET');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED');

-- CreateTable
CREATE TABLE "user" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "session" (
    "_id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "account" (
    "_id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "verification" (
    "_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "folder" (
    "_id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "lecture" (
    "_id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "lecture_source" (
    "_id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "kind" "SourceType" NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "textContent" TEXT,
    "transcript" TEXT,
    "language" TEXT,
    "durationSeconds" INTEGER,
    "pageCount" INTEGER,
    "checksum" TEXT,
    "status" "ProcessingStatus" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_source_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "artifact" (
    "_id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "status" "ProcessingStatus" NOT NULL,
    "coverImageUrl" TEXT,
    "fileUrl" TEXT,
    "transcript" TEXT,
    "durationSeconds" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifact_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "artifact_source" (
    "artifactId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "artifact_source_pkey" PRIMARY KEY ("artifactId","sourceId")
);

-- CreateTable
CREATE TABLE "qa_pair" (
    "_id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "choices" JSONB,
    "correctKey" TEXT,
    "difficulty" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_pair_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "flashcard" (
    "_id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "hint" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "lecture_assistant" (
    "_id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "displayName" TEXT,
    "systemPrompt" TEXT,
    "model" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_assistant_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "_id" TEXT NOT NULL,
    "assistantId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolName" TEXT,
    "model" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "bookmark" (
    "userId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmark_pkey" PRIMARY KEY ("userId","lectureId")
);

-- CreateTable
CREATE TABLE "room" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPrivate" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "room_membership" (
    "_id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitedById" TEXT,
    "role" "MemberRole" NOT NULL,
    "status" "MemberStatus" NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_membership_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "room_share" (
    "_id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "sharedById" TEXT NOT NULL,
    "caption" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_share_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "room_note" (
    "_id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_note_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "folder_ownerId_name_key" ON "folder"("ownerId", "name");

-- CreateIndex
CREATE INDEX "lecture_source_lectureId_idx" ON "lecture_source"("lectureId");

-- CreateIndex
CREATE INDEX "artifact_lectureId_type_idx" ON "artifact"("lectureId", "type");

-- CreateIndex
CREATE INDEX "qa_pair_artifactId_idx" ON "qa_pair"("artifactId");

-- CreateIndex
CREATE INDEX "flashcard_artifactId_idx" ON "flashcard"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_assistant_lectureId_key" ON "lecture_assistant"("lectureId");

-- CreateIndex
CREATE INDEX "chat_message_assistantId_createdAt_idx" ON "chat_message"("assistantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "room_membership_roomId_userId_key" ON "room_membership"("roomId", "userId");

-- CreateIndex
CREATE INDEX "room_share_roomId_idx" ON "room_share"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "room_share_roomId_artifactId_sharedById_key" ON "room_share"("roomId", "artifactId", "sharedById");

-- CreateIndex
CREATE INDEX "room_note_shareId_createdAt_idx" ON "room_note"("shareId", "createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture" ADD CONSTRAINT "lecture_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture" ADD CONSTRAINT "lecture_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_source" ADD CONSTRAINT "lecture_source_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lecture"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lecture"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact_source" ADD CONSTRAINT "artifact_source_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact_source" ADD CONSTRAINT "artifact_source_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "lecture_source"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qa_pair" ADD CONSTRAINT "qa_pair_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard" ADD CONSTRAINT "flashcard_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_assistant" ADD CONSTRAINT "lecture_assistant_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lecture"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_assistantId_fkey" FOREIGN KEY ("assistantId") REFERENCES "lecture_assistant"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lecture"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_membership" ADD CONSTRAINT "room_membership_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_membership" ADD CONSTRAINT "room_membership_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_membership" ADD CONSTRAINT "room_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_share" ADD CONSTRAINT "room_share_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "room"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_share" ADD CONSTRAINT "room_share_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "artifact"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_share" ADD CONSTRAINT "room_share_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_note" ADD CONSTRAINT "room_note_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "room_share"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_note" ADD CONSTRAINT "room_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
