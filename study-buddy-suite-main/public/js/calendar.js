/**
 * Calendar Module
 * Handles calendar view with month navigation and day task management.
 * Calendar tasks are independent of to-do list tasks.
 */

// Module state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;
let selectedDayTaskId = null;
let isDayTaskEditMode = false;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Initialize the calendar module
 */
function initCalendar() {
  // Navigation buttons
  document.getElementById('prevMonthBtn').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('nextMonthBtn').addEventListener('click', () => navigateMonth(1));
  
  // Back to month button
  document.getElementById('backToMonthBtn').addEventListener('click', closeDayView);
  
  // Add day task button
  document.getElementById('addDayTaskBtn').addEventListener('click', () => openDayTaskModal());
  
  // Day task modal events
  document.getElementById('closeDayTaskModal').addEventListener('click', closeDayTaskModal);
  document.getElementById('cancelDayTaskBtn').addEventListener('click', closeDayTaskModal);
  document.getElementById('submitDayTaskBtn').addEventListener('click', handleDayTaskSubmit);
  
  // Render initial calendar
  renderCalendar();
}

/**
 * Navigate to previous/next month
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateMonth(direction) {
  currentMonth += direction;
  
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  
  renderCalendar();
}

/**
 * Render the calendar month view
 */
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('monthLabel');
  
  // Update month label
  monthLabel.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  
  // Get first day of month and total days
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = lastDay.getDate();
  
  // Get day of week for first day (0 = Sunday, convert to 0 = Monday)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  
  // Get today for highlighting
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayDate = today.getDate();
  
  // Build calendar HTML
  let html = `
    <div class="calendar-header">
      ${DAY_NAMES.map(day => `<div class="calendar-header-cell">${day}</div>`).join('')}
    </div>
    <div class="calendar-body">
  `;
  
  // Previous month days
  const prevMonth = new Date(currentYear, currentMonth, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    html += `<div class="calendar-cell other-month"><span class="day-number">${day}</span></div>`;
  }
  
  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateISO(currentYear, currentMonth, day);
    const hasTasks = dateHasTasks(dateStr);
    const isToday = isCurrentMonth && day === todayDate;
    
    html += `
      <div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <span class="day-number">${day}</span>
        ${hasTasks ? '<div class="task-indicator"></div>' : ''}
      </div>
    `;
  }
  
  // Next month days to fill the grid
  const cellsUsed = startDayOfWeek + totalDays;
  const remainingCells = cellsUsed % 7 === 0 ? 0 : 7 - (cellsUsed % 7);
  for (let day = 1; day <= remainingCells; day++) {
    html += `<div class="calendar-cell other-month"><span class="day-number">${day}</span></div>`;
  }
  
  html += '</div>';
  grid.innerHTML = html;
  
  // Add click handlers
  grid.querySelectorAll('.calendar-cell:not(.other-month)').forEach(cell => {
    cell.addEventListener('click', () => openDayView(cell.dataset.date));
  });
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param {number} year 
 * @param {number} month - 0-indexed
 * @param {number} day 
 * @returns {string} ISO date string
 */
function formatDateISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Format date for display in day view
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date (e.g., "5 January 2026")
 */
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Open the day view panel
 * @param {string} date - ISO date string
 */
function openDayView(date) {
  selectedDate = date;
  
  const calendarGrid = document.getElementById('calendarGrid');
  const dayPanel = document.getElementById('dayViewPanel');
  const dateLabel = document.getElementById('selectedDateLabel');
  
  dateLabel.textContent = formatDateDisplay(date);
  
  calendarGrid.style.display = 'none';
  dayPanel.classList.add('show');
  
  renderDayTasks();
}

/**
 * Close the day view panel
 */
function closeDayView() {
  const calendarGrid = document.getElementById('calendarGrid');
  const dayPanel = document.getElementById('dayViewPanel');
  
  dayPanel.classList.remove('show');
  calendarGrid.style.display = 'block';
  
  selectedDate = null;
  renderCalendar();
}

/**
 * Render tasks for the selected day
 */
function renderDayTasks() {
  const container = document.getElementById('dayTasksList');
  const day = getCalendarDay(selectedDate);
  const tasks = day.tasks || [];
  
  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No tasks for this day. Click "+" to add one!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = tasks.map(task => `
    <div class="day-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="day-task-bullet"></div>
      <span class="day-task-text">${escapeHtml(task.text)}</span>
      <div class="day-task-actions">
        <div class="todo-checkbox ${task.completed ? 'checked' : ''}" 
             onclick="toggleDayTaskComplete('${task.id}')">
        </div>
        <button class="more-btn" onclick="showDayTaskMenu(event, '${task.id}')">⋯</button>
      </div>
    </div>
  `).join('');
}

/**
 * Toggle day task completion
 * @param {string} taskId - Task ID
 */
function toggleDayTaskComplete(taskId) {
  const day = getCalendarDay(selectedDate);
  const task = day.tasks.find(t => t.id === taskId);
  if (task) {
    updateCalendarTask(selectedDate, taskId, { completed: !task.completed });
    renderDayTasks();
  }
}

/**
 * Show day task context menu
 * @param {Event} e - Click event
 * @param {string} taskId - Task ID
 */
function showDayTaskMenu(e, taskId) {
  e.stopPropagation();
  selectedDayTaskId = taskId;
  
  // Simple confirm for now
  const action = prompt('Enter "edit" to edit or "delete" to delete:');
  
  if (action === 'edit') {
    const day = getCalendarDay(selectedDate);
    const task = day.tasks.find(t => t.id === taskId);
    if (task) {
      openDayTaskModal(task);
    }
  } else if (action === 'delete') {
    showConfirmModal(
      'Are you sure you want to delete this task?',
      () => {
        deleteCalendarTask(selectedDate, taskId);
        renderDayTasks();
      }
    );
  }
}

/**
 * Open day task modal
 * @param {Object} task - Task to edit (optional)
 */
function openDayTaskModal(task = null) {
  isDayTaskEditMode = !!task;
  selectedDayTaskId = task ? task.id : null;
  
  const modal = document.getElementById('dayTaskModal');
  const title = document.getElementById('dayTaskModalTitle');
  const textInput = document.getElementById('dayTaskTextInput');
  
  title.textContent = isDayTaskEditMode ? 'Edit Task' : 'New Task';
  textInput.value = task ? task.text : '';
  
  modal.classList.add('show');
  textInput.focus();
}

/**
 * Close day task modal
 */
function closeDayTaskModal() {
  document.getElementById('dayTaskModal').classList.remove('show');
  document.getElementById('dayTaskTextInput').value = '';
  isDayTaskEditMode = false;
  selectedDayTaskId = null;
}

/**
 * Handle day task form submission
 */
function handleDayTaskSubmit() {
  const text = document.getElementById('dayTaskTextInput').value.trim();
  
  if (!text) {
    alert('Please enter a task');
    return;
  }
  
  if (isDayTaskEditMode && selectedDayTaskId) {
    updateCalendarTask(selectedDate, selectedDayTaskId, { text });
  } else {
    addCalendarTask(selectedDate, text);
  }
  
  closeDayTaskModal();
  renderDayTasks();
}
