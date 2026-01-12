-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "period_end_date" DATE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_leads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_teams" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "team_lead_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accomplishments" (
    "id" SERIAL NOT NULL,
    "report_team_id" INTEGER NOT NULL,
    "section_name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "ticket_id" VARCHAR(50),
    "ticket_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accomplishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "report_team_id" INTEGER NOT NULL,
    "section_name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "ticket_id" VARCHAR(50),
    "ticket_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockers" (
    "id" SERIAL NOT NULL,
    "report_team_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "ticket_id" VARCHAR(50),
    "ticket_url" TEXT,
    "workaround" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" SERIAL NOT NULL,
    "report_team_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "mitigation" TEXT,
    "severity" VARCHAR(50) NOT NULL DEFAULT 'medium',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_period_end_date_key" ON "reports"("period_end_date");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_leads_name_key" ON "team_leads"("name");

-- CreateIndex
CREATE INDEX "report_teams_report_id_idx" ON "report_teams"("report_id");

-- CreateIndex
CREATE INDEX "report_teams_team_id_idx" ON "report_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_teams_report_id_team_id_key" ON "report_teams"("report_id", "team_id");

-- CreateIndex
CREATE INDEX "accomplishments_report_team_id_idx" ON "accomplishments"("report_team_id");

-- CreateIndex
CREATE INDEX "goals_report_team_id_idx" ON "goals"("report_team_id");

-- CreateIndex
CREATE INDEX "blockers_report_team_id_idx" ON "blockers"("report_team_id");

-- CreateIndex
CREATE INDEX "risks_report_team_id_idx" ON "risks"("report_team_id");

-- AddForeignKey
ALTER TABLE "report_teams" ADD CONSTRAINT "report_teams_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_teams" ADD CONSTRAINT "report_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_teams" ADD CONSTRAINT "report_teams_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "team_leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accomplishments" ADD CONSTRAINT "accomplishments_report_team_id_fkey" FOREIGN KEY ("report_team_id") REFERENCES "report_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_report_team_id_fkey" FOREIGN KEY ("report_team_id") REFERENCES "report_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockers" ADD CONSTRAINT "blockers_report_team_id_fkey" FOREIGN KEY ("report_team_id") REFERENCES "report_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_report_team_id_fkey" FOREIGN KEY ("report_team_id") REFERENCES "report_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
