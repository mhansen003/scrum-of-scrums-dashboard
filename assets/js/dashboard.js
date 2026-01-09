// Scrum of Scrums Dashboard
// Data visualization and trending analytics

const weeks = [
  { date: '2025-11-24', label: 'Nov 24, 2025' },
  { date: '2025-12-08', label: 'Dec 8, 2025' },
  { date: '2025-12-29', label: 'Dec 29, 2025' },
  { date: '2026-01-09', label: 'Jan 9, 2026' }
];

let allWeekData = {};
let charts = {};

// Chart.js default configuration
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size = 12;

// Initialize dashboard
async function initDashboard() {
  try {
    // Load all week data
    await loadAllWeeks();

    // Calculate overview stats
    updateOverviewStats();

    // Render all charts
    renderAccomplishmentsChart();
    renderBlockersRisksChart();
    renderTeamActivityChart();
    renderWorkDistributionChart();

    // Render team list
    renderTeamList();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    document.getElementById('teamList').innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #f43f5e;">
        <p>Error loading dashboard data. Please check the console for details.</p>
      </div>
    `;
  }
}

// Load all week data files
async function loadAllWeeks() {
  const promises = weeks.map(week =>
    fetch(`./data/${week.date}.json`)
      .then(response => response.json())
      .then(data => {
        allWeekData[week.date] = data;
      })
      .catch(err => {
        console.error(`Error loading ${week.date}:`, err);
        // Return placeholder data if file doesn't exist yet
        allWeekData[week.date] = { weekEnding: week.date, teams: [] };
      })
  );

  await Promise.all(promises);
}

// Update overview statistics
function updateOverviewStats() {
  const latestWeek = allWeekData[weeks[weeks.length - 1].date];

  if (!latestWeek || !latestWeek.teams) return;

  let totalAccomplishments = 0;
  let totalBlockers = 0;
  let totalRisks = 0;

  latestWeek.teams.forEach(team => {
    totalAccomplishments += team.accomplishmentsCount || 0;
    totalBlockers += team.blockersCount || 0;
    totalRisks += team.risksCount || 0;
  });

  document.getElementById('totalAccomplishments').textContent = totalAccomplishments;
  document.getElementById('totalBlockers').textContent = totalBlockers;
  document.getElementById('totalRisks').textContent = totalRisks;
}

// Render accomplishments trend chart
function renderAccomplishmentsChart() {
  const ctx = document.getElementById('accomplishmentsChart');

  const datasets = {};

  // Aggregate accomplishments per team across all weeks
  weeks.forEach(week => {
    const weekData = allWeekData[week.date];
    if (!weekData || !weekData.teams) return;

    weekData.teams.forEach(team => {
      if (!datasets[team.name]) {
        datasets[team.name] = [];
      }
      datasets[team.name].push(team.accomplishmentsCount || 0);
    });
  });

  const chartData = {
    labels: weeks.map(w => w.label),
    datasets: Object.keys(datasets).slice(0, 5).map((teamName, index) => ({
      label: teamName,
      data: datasets[teamName],
      borderColor: getTeamColor(index),
      backgroundColor: getTeamColor(index, 0.1),
      tension: 0.4
    }))
  };

  charts.accomplishments = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255,255,255,0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Render blockers & risks chart
function renderBlockersRisksChart() {
  const ctx = document.getElementById('blockersRisksChart');

  const blockersData = [];
  const risksData = [];

  weeks.forEach(week => {
    const weekData = allWeekData[week.date];
    if (!weekData || !weekData.teams) {
      blockersData.push(0);
      risksData.push(0);
      return;
    }

    let weekBlockers = 0;
    let weekRisks = 0;

    weekData.teams.forEach(team => {
      weekBlockers += team.blockersCount || 0;
      weekRisks += team.risksCount || 0;
    });

    blockersData.push(weekBlockers);
    risksData.push(weekRisks);
  });

  charts.blockersRisks = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks.map(w => w.label),
      datasets: [
        {
          label: 'Blockers',
          data: blockersData,
          backgroundColor: '#f59e0b',
          borderRadius: 6
        },
        {
          label: 'Critical Risks',
          data: risksData,
          backgroundColor: '#f43f5e',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255,255,255,0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Render team activity chart (latest week)
function renderTeamActivityChart() {
  const ctx = document.getElementById('teamActivityChart');
  const latestWeek = allWeekData[weeks[weeks.length - 1].date];

  if (!latestWeek || !latestWeek.teams) return;

  const teamNames = latestWeek.teams.map(t => t.name.replace(' Team', '').replace('Team ', ''));
  const accomplishments = latestWeek.teams.map(t => t.accomplishmentsCount || 0);
  const goals = latestWeek.teams.map(t => t.goalsCount || 0);

  charts.teamActivity = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: teamNames,
      datasets: [
        {
          label: 'Accomplishments',
          data: accomplishments,
          backgroundColor: '#14b8a6',
          borderRadius: 6
        },
        {
          label: 'Goals',
          data: goals,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255,255,255,0.05)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Render work distribution chart
function renderWorkDistributionChart() {
  const ctx = document.getElementById('workDistributionChart');
  const latestWeek = allWeekData[weeks[weeks.length - 1].date];

  if (!latestWeek || !latestWeek.teams) return;

  let totalWork = 0;
  const teamWork = latestWeek.teams.map(team => {
    const work = (team.accomplishmentsCount || 0) + (team.goalsCount || 0);
    totalWork += work;
    return work;
  });

  charts.workDistribution = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: latestWeek.teams.map(t => t.name),
      datasets: [{
        data: teamWork,
        backgroundColor: [
          '#3b82f6',
          '#14b8a6',
          '#f59e0b',
          '#f43f5e',
          '#8b5cf6',
          '#ec4899',
          '#10b981',
          '#f97316',
          '#06b6d4'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = ((value / totalWork) * 100).toFixed(1);
              return `${label}: ${value} items (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Render team list
function renderTeamList() {
  const teamListEl = document.getElementById('teamList');
  const latestWeek = allWeekData[weeks[weeks.length - 1].date];

  if (!latestWeek || !latestWeek.teams || latestWeek.teams.length === 0) {
    teamListEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #64748b;">No team data available</div>';
    return;
  }

  const teamsHTML = latestWeek.teams.map(team => `
    <div class="team-item">
      <div>
        <div class="team-name">${team.name}</div>
        <div class="team-lead">${team.lead}</div>
      </div>
      <div class="team-metrics">
        <div class="metric">
          <span class="metric-value">${team.accomplishmentsCount || 0}</span>
          <span class="metric-label">Done</span>
        </div>
        <div class="metric">
          <span class="metric-value" style="color: #3b82f6;">${team.goalsCount || 0}</span>
          <span class="metric-label">Goals</span>
        </div>
        <div class="metric">
          <span class="metric-value" style="color: #f59e0b;">${team.blockersCount || 0}</span>
          <span class="metric-label">Blockers</span>
        </div>
        <div class="metric">
          <span class="metric-value" style="color: #f43f5e;">${team.risksCount || 0}</span>
          <span class="metric-label">Risks</span>
        </div>
      </div>
    </div>
  `).join('');

  teamListEl.innerHTML = teamsHTML;
}

// Helper: Get team color
function getTeamColor(index, alpha = 1) {
  const colors = [
    `rgba(59, 130, 246, ${alpha})`,   // blue
    `rgba(20, 184, 166, ${alpha})`,   // teal
    `rgba(245, 158, 11, ${alpha})`,   // amber
    `rgba(244, 63, 94, ${alpha})`,    // rose
    `rgba(139, 92, 246, ${alpha})`,   // purple
    `rgba(236, 72, 153, ${alpha})`,   // pink
    `rgba(16, 185, 129, ${alpha})`,   // green
    `rgba(249, 115, 22, ${alpha})`,   // orange
    `rgba(6, 182, 212, ${alpha})`     // cyan
  ];
  return colors[index % colors.length];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
