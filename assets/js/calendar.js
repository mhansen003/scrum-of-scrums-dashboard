// Calendar component for Scrum of Scrums Dashboard
const availableWeeks = [
  { date: '2025-11-24', label: 'Nov 24, 2025', url: './weeks/2025-11-24.html' },
  { date: '2025-12-08', label: 'Dec 8, 2025', url: './weeks/2025-12-08.html' },
  { date: '2025-12-29', label: 'Dec 29, 2025', url: './weeks/2025-12-29.html' },
  { date: '2026-01-09', label: 'Jan 9, 2026', url: './weeks/2026-01-09.html' }
];

let currentMonth = new Date();
let selectedWeek = null;

// Get week ending date (Sunday)
function getWeekEnding(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 7 - day; // Days until Sunday
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// Check if a date has data available
function hasDataForWeek(date) {
  const weekEnding = getWeekEnding(date);
  return availableWeeks.some(week => week.date === weekEnding);
}

// Get week data
function getWeekData(date) {
  const weekEnding = getWeekEnding(date);
  return availableWeeks.find(week => week.date === weekEnding);
}

// Format month/year for display
function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Get first day of month
function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Get last day of month
function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Render calendar
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;

  const firstDay = getFirstDayOfMonth(currentMonth);
  const lastDay = getLastDayOfMonth(currentMonth);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const totalDays = lastDay.getDate();

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
    <div class="calendar-weekdays">
      <div class="weekday">Sun</div>
      <div class="weekday">Mon</div>
      <div class="weekday">Tue</div>
      <div class="weekday">Wed</div>
      <div class="weekday">Thu</div>
      <div class="weekday">Fri</div>
      <div class="weekday">Sat</div>
    </div>
    <div class="calendar-grid">
  `;

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Days of the month
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const weekData = getWeekData(date);
    const hasData = weekData !== undefined;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isSelected = selectedWeek && weekData && weekData.date === selectedWeek;

    let classes = 'calendar-day';
    if (hasData) classes += ' has-data';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';

    const onclick = hasData ? `onclick="selectWeek('${weekData.date}')"` : '';

    html += `
      <div class="${classes}" ${onclick} ${hasData ? 'title="Week ending ' + weekData.label + '"' : ''}>
        <span class="day-number">${day}</span>
        ${hasData ? '<span class="data-indicator"></span>' : ''}
      </div>
    `;
  }

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
