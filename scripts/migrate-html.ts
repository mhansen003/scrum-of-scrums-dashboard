import * as path from 'path';
import { prisma } from '../lib/prisma.js';
import { migrateAllReports, ParsedReport, ParsedTeam } from '../lib/html-parser.js';

/**
 * Migration script to populate database from HTML reports
 */
async function main() {
  console.log('🚀 Starting HTML to Database migration...\n');

  const weeksDir = path.join(process.cwd(), 'weeks');

  // Parse all HTML files
  console.log('📖 Parsing HTML files...');
  const parseResults = await migrateAllReports(weeksDir);

  const successfulParses = parseResults.filter(r => r.success);
  const failedParses = parseResults.filter(r => !r.success);

  if (failedParses.length > 0) {
    console.error(`\n❌ ${failedParses.length} files failed to parse:`);
    failedParses.forEach(f => console.error(`  - ${f.file}: ${f.error}`));
  }

  console.log(`\n✓ Successfully parsed ${successfulParses.length} HTML files\n`);

  // Extract unique teams and leads
  console.log('🔍 Extracting unique teams and leads...');
  const uniqueTeamNames = new Set<string>();
  const uniqueLeadNames = new Set<string>();

  successfulParses.forEach(result => {
    const report = (result as any).data as ParsedReport;
    report.teams.forEach(team => {
      uniqueTeamNames.add(team.name);
      uniqueLeadNames.add(team.lead);
    });
  });

  console.log(`  Found ${uniqueTeamNames.size} unique teams`);
  console.log(`  Found ${uniqueLeadNames.size} unique team leads\n`);

  // Create teams
  console.log('👥 Creating teams in database...');
  const teamMap = new Map<string, number>();
  const usedSlugs = new Set<string>();

  for (const teamName of uniqueTeamNames) {
    let baseSlug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    // Handle slug collisions by appending a number
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    const team = await prisma.team.upsert({
      where: { name: teamName },
      update: {},
      create: { name: teamName, slug }
    });
    teamMap.set(teamName, team.id);
    console.log(`  ✓ Created team: ${teamName}`);
  }

  // Create team leads
  console.log('\n👤 Creating team leads in database...');
  const leadMap = new Map<string, number>();

  for (const leadName of uniqueLeadNames) {
    const lead = await prisma.teamLead.upsert({
      where: { name: leadName },
      update: {},
      create: { name: leadName }
    });
    leadMap.set(leadName, lead.id);
    console.log(`  ✓ Created team lead: ${leadName}`);
  }

  // Create reports with nested data
  console.log('\n📊 Creating reports with nested data...\n');
  let totalAccomplishments = 0;
  let totalGoals = 0;
  let totalBlockers = 0;
  let totalRisks = 0;

  for (const result of successfulParses) {
    const report = (result as any).data as ParsedReport;
    const fileName = (result as any).file;

    console.log(`Processing report: ${fileName}`);
    console.log(`  Date: ${report.periodEndDate.toISOString().split('T')[0]}`);
    console.log(`  Teams: ${report.teams.length}`);

    try {
      // Create report
      const dbReport = await prisma.report.create({
        data: {
          periodEndDate: report.periodEndDate,
          title: report.title,
          published: true
        }
      });

      // Create report teams with nested data
      for (let i = 0; i < report.teams.length; i++) {
        const team = report.teams[i];
        const teamId = teamMap.get(team.name);
        const leadId = leadMap.get(team.lead);

        if (!teamId || !leadId) {
          console.error(`  ⚠️  Skipping team ${team.name} - missing team or lead ID`);
          continue;
        }

        const reportTeam = await prisma.reportTeam.create({
          data: {
            reportId: dbReport.id,
            teamId: teamId,
            teamLeadId: leadId,
            displayOrder: i,
            accomplishments: {
              create: team.accomplishments.map((item, idx) => ({
                sectionName: item.section || 'General',
                description: item.description,
                ticketId: item.ticketId,
                ticketUrl: item.ticketUrl,
                displayOrder: idx
              }))
            },
            goals: {
              create: team.goals.map((item, idx) => ({
                sectionName: item.section || 'General',
                description: item.description,
                ticketId: item.ticketId,
                ticketUrl: item.ticketUrl,
                displayOrder: idx
              }))
            },
            blockers: {
              create: team.blockers.map((item, idx) => ({
                description: item.description,
                ticketId: item.ticketId,
                ticketUrl: item.ticketUrl,
                displayOrder: idx
              }))
            },
            risks: {
              create: team.risks.map((item, idx) => ({
                description: item.description,
                severity: 'medium',
                displayOrder: idx
              }))
            }
          }
        });

        totalAccomplishments += team.accomplishments.length;
        totalGoals += team.goals.length;
        totalBlockers += team.blockers.length;
        totalRisks += team.risks.length;

        console.log(`    ✓ ${team.name}: ${team.accomplishments.length} accomplishments, ${team.goals.length} goals, ${team.blockers.length} blockers, ${team.risks.length} risks`);
      }

      console.log(`  ✓ Report created successfully\n`);

    } catch (error: any) {
      console.error(`  ❌ Error creating report: ${error.message}\n`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Migration Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Reports migrated: ${successfulParses.length}`);
  console.log(`👥 Teams created: ${uniqueTeamNames.size}`);
  console.log(`👤 Team leads created: ${uniqueLeadNames.size}`);
  console.log(`🎯 Total accomplishments: ${totalAccomplishments}`);
  console.log(`🎯 Total goals: ${totalGoals}`);
  console.log(`🚧 Total blockers: ${totalBlockers}`);
  console.log(`⚠️  Total risks: ${totalRisks}`);
  console.log('='.repeat(60) + '\n');

  // Validate data
  console.log('🔍 Validating migration...\n');

  const reportCount = await prisma.report.count();
  const teamCount = await prisma.team.count();
  const leadCount = await prisma.teamLead.count();
  const accomplishmentCount = await prisma.accomplishment.count();
  const goalCount = await prisma.goal.count();
  const blockerCount = await prisma.blocker.count();
  const riskCount = await prisma.risk.count();

  console.log('Database counts:');
  console.log(`  Reports: ${reportCount}`);
  console.log(`  Teams: ${teamCount}`);
  console.log(`  Team Leads: ${leadCount}`);
  console.log(`  Accomplishments: ${accomplishmentCount}`);
  console.log(`  Goals: ${goalCount}`);
  console.log(`  Blockers: ${blockerCount}`);
  console.log(`  Risks: ${riskCount}`);

  const isValid =
    reportCount === successfulParses.length &&
    accomplishmentCount === totalAccomplishments &&
    goalCount === totalGoals &&
    blockerCount === totalBlockers &&
    riskCount === totalRisks;

  if (isValid) {
    console.log('\n✅ Validation passed! All data migrated correctly.\n');
  } else {
    console.log('\n⚠️  Validation warning: Counts may not match. Please review.\n');
  }
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
