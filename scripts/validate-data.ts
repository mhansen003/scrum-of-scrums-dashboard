import { prisma } from '../lib/prisma.js';

async function main() {
  console.log('\n🔍 Validating Database Migration...\n');

  const reportCount = await prisma.report.count();
  const teamCount = await prisma.team.count();
  const leadCount = await prisma.teamLead.count();
  const reportTeamCount = await prisma.reportTeam.count();
  const accomplishmentCount = await prisma.accomplishment.count();
  const goalCount = await prisma.goal.count();
  const blockerCount = await prisma.blocker.count();
  const riskCount = await prisma.risk.count();

  console.log('📊 Database Statistics:');
  console.log('═'.repeat(50));
  console.log(`  Reports:         ${reportCount}`);
  console.log(`  Teams:           ${teamCount}`);
  console.log(`  Team Leads:      ${leadCount}`);
  console.log(`  Report Teams:    ${reportTeamCount}`);
  console.log(`  Accomplishments: ${accomplishmentCount}`);
  console.log(`  Goals:           ${goalCount}`);
  console.log(`  Blockers:        ${blockerCount}`);
  console.log(`  Risks:           ${riskCount}`);
  console.log('═'.repeat(50));

  // Get latest report
  const latestReport = await prisma.report.findFirst({
    orderBy: { periodEndDate: 'desc' },
    include: {
      reportTeams: {
        include: {
          team: true,
          teamLead: true,
          accomplishments: true,
          goals: true,
          blockers: true,
          risks: true
        }
      }
    }
  });

  if (latestReport) {
    console.log(`\n✨ Latest Report (${latestReport.periodEndDate.toISOString().split('T')[0]}):`);
    console.log(`  Title: ${latestReport.title}`);
    console.log(`  Teams: ${latestReport.reportTeams.length}`);

    let totalAcc = 0;
    let totalGoals = 0;
    let totalBlockers = 0;
    let totalRisks = 0;

    latestReport.reportTeams.forEach(rt => {
      totalAcc += rt.accomplishments.length;
      totalGoals += rt.goals.length;
      totalBlockers += rt.blockers.length;
      totalRisks += rt.risks.length;
    });

    console.log(`  Accomplishments: ${totalAcc}`);
    console.log(`  Goals: ${totalGoals}`);
    console.log(`  Blockers: ${totalBlockers}`);
    console.log(`  Risks: ${totalRisks}`);
  }

  // List all report dates
  const allReports = await prisma.report.findMany({
    orderBy: { periodEndDate: 'asc' },
    select: { periodEndDate: true, title: true }
  });

  console.log(`\n📅 All Reports (${allReports.length} total):`);
  allReports.forEach((report, index) => {
    console.log(`  ${index + 1}. ${report.periodEndDate.toISOString().split('T')[0]}`);
  });

  console.log('\n✅ Validation complete!\n');
}

main()
  .catch((error) => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
