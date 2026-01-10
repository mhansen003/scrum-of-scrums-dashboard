// Weekly Calendar component for Scrum of Scrums Dashboard
const availableWeeks = [
  { date: '2025-11-24', label: 'Nov 24, 2025', url: './weeks/2025-11-24.html' },
  { date: '2025-12-08', label: 'Dec 8, 2025', url: './weeks/2025-12-08.html' },
  { date: '2025-12-29', label: 'Dec 29, 2025', url: './weeks/2025-12-29.html' },
  { date: '2026-01-09', label: 'Jan 9, 2026', url: './weeks/2026-01-09.html' }
];

let currentMonth = new Date();
let selectedWeek = null;

// Get week ending date (Sunday) for any date
function getWeekEnding(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 7 - day; // Days until Sunday
  d.setDate(d.getDate() + diff);
  return d;
}

// Get week starting date (Monday) for any date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Days since Monday
  d.setDate(d.getDate() + diff);
  return d;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Format date range for display
function formatDateRange(startDate, endDate) {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${start} - ${end}`;
}

// Format month/year for display
function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Check if a week has data available
function hasDataForWeek(weekStartDate, weekEndDate) {
  return availableWeeks.some(week => {
    const weekDate = new Date(week.date);
    return weekDate >= weekStartDate && weekDate <= weekEndDate;
  });
}

// Get week data
function getWeekData(weekStartDate, weekEndDate) {
  return availableWeeks.find(week => {
    const weekDate = new Date(week.date);
    return weekDate >= weekStartDate && weekDate <= weekEndDate;
  });
}

// Get all weeks in a month
function getWeeksInMonth(date) {
  const weeks = [];
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Start from the Monday of the week containing the first day
  let currentWeekStart = getWeekStart(firstDay);

  // Continue until we've covered the entire month
  while (currentWeekStart <= lastDay) {
    const weekEnd = getWeekEnding(currentWeekStart);

    // Only include weeks that have days in this month
    if (currentWeekStart <= lastDay || weekEnd.getMonth() === date.getMonth()) {
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd)
      });
    }

    // Move to next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return weeks;
}

// Render calendar
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;

  const weeks = getWeeksInMonth(currentMonth);

  let html = `
    <div class="calendar-header">
      <button class="calendar-nav" onclick="previousMonth()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
        </svg>
      </button>
      <h3 class="calendar-title">${formatMonthYear(currentMonth)}</h3>
      <button class="calendar-nav" onclick="nextMonth()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
        </svg>
      </button>
    </div>
    <div class="calendar-weeks">
  `;

  // Render each week
  weeks.forEach(week => {
    const weekData = getWeekData(week.start, week.end);
    const hasData = weekData !== undefined;
    const isSelected = selectedWeek && weekData && weekData.date === selectedWeek;
    const dateRange = formatDateRange(week.start, week.end);
    const weekEndingLabel = week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let classes = 'calendar-week';
    if (hasData) classes += ' has-data';
    if (isSelected) classes += ' selected';

    const onclick = hasData ? `onclick="selectWeek('${weekData.date}')"` : '';
    const title = hasData ? `Week ending ${weekEndingLabel}` : '';

    html += `
      <div class="${classes}" ${onclick} ${title ? 'title="' + title + '"' : ''}>
        <div class="week-label">
          <span class="week-range">${dateRange}</span>
        </div>
        <div class="week-ending">
          Week ending: <strong>${week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
        </div>
        ${hasData ? '<div class="week-indicator">📊 Data Available</div>' : '<div class="week-placeholder">No data</div>'}
      </div>
    `;
  });

  html += '</div>';
  calendar.innerHTML = html;
}

// Navigate to previous month
function previousMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
}

// Navigate to next month
function nextMonth() {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
}

// Select a week
function selectWeek(weekDate) {
  const weekData = availableWeeks.find(w => w.date === weekDate);
  if (weekData) {
    window.location.href = weekData.url;
  }
}

// Set current page's week as selected
function setSelectedWeek(weekDate) {
  selectedWeek = weekDate;
  if (weekDate) {
    const date = new Date(weekDate);
    currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  }
  renderCalendar();
}

// Initialize calendar on page load
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});
