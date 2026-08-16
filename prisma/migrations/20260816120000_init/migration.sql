-- CreateTable
CREATE TABLE "Category" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL,
    "uid" TEXT,
    "goal" TEXT
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uid" TEXT,
    "categoryName" TEXT NOT NULL,
    CONSTRAINT "Group_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Requirement" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "groupId" TEXT,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagComment" TEXT,
    CONSTRAINT "Requirement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "stimulus" TEXT NOT NULL,
    "metricQuestion" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagComment" TEXT,
    "rationale" TEXT
);

-- CreateTable
CREATE TABLE "ScenarioOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scenarioId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagComment" TEXT,
    CONSTRAINT "ScenarioOption_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conflict" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "req1Id" TEXT NOT NULL,
    "req2Id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "conflictText" TEXT NOT NULL,
    "bestPractice" TEXT,
    "isGroundTruth" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Conflict_req1Id_fkey" FOREIGN KEY ("req1Id") REFERENCES "Requirement" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conflict_req2Id_fkey" FOREIGN KEY ("req2Id") REFERENCES "Requirement" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DecisionTree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OptionRequirements" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_OptionRequirements_A_fkey" FOREIGN KEY ("A") REFERENCES "Requirement" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OptionRequirements_B_fkey" FOREIGN KEY ("B") REFERENCES "ScenarioOption" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_uid_key" ON "Category"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Group_uid_key" ON "Group"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "Conflict_req1Id_req2Id_key" ON "Conflict"("req1Id", "req2Id");

-- CreateIndex
CREATE UNIQUE INDEX "_OptionRequirements_AB_unique" ON "_OptionRequirements"("A", "B");

-- CreateIndex
CREATE INDEX "_OptionRequirements_B_index" ON "_OptionRequirements"("B");

