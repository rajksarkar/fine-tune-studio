-- CreateTable
CREATE TABLE "FineTuneFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "openai_file_id" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FineTuneJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openai_job_id" TEXT NOT NULL,
    "base_model" TEXT NOT NULL,
    "training_file_id" TEXT NOT NULL,
    "validation_file_id" TEXT,
    "status" TEXT NOT NULL,
    "fine_tuned_model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FineTuneJob_training_file_id_fkey" FOREIGN KEY ("training_file_id") REFERENCES "FineTuneFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FineTuneJob_validation_file_id_fkey" FOREIGN KEY ("validation_file_id") REFERENCES "FineTuneFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ABRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "modelA" TEXT NOT NULL,
    "outputA" TEXT NOT NULL,
    "modelB" TEXT NOT NULL,
    "outputB" TEXT NOT NULL,
    "winner" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrainingDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "ideal_answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FineTuneFile_openai_file_id_key" ON "FineTuneFile"("openai_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "FineTuneJob_openai_job_id_key" ON "FineTuneJob"("openai_job_id");
