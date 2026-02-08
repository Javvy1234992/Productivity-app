/**
 * To-Do Module
 * Handles the to-do list functionality including filtering, 
 * adding, editing, and completing tasks.
 */

// Module state
let currentFilter = 'all';
let selectedTaskId = null;
let isEditMode = false;

/**
 * Initialize the to-do module
 */
function initTodo() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
  });
  
  // Add task button
  document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
  document.getElementById('homeNewTaskBtn').addEventListener('click', () => openTaskModal());
  
  // Task modal events
  document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
  document.getElementById('cancelTaskBtn').addEventListener('click', closeTaskModal);
  document.getElementById('submitTaskBtn').addEventListener('click', handleTaskSubmit);
  
  // Context menu
  document.getElementById('editTaskBtn').addEventListener('click', handleEditTask);
  document.getElementById('deleteTaskBtn').addEventListener('click', handleDeleteTask);
  
  // Close context menu on outside click
  document.addEventListener('click', (e) => {
    const contextMenu = document.getElementById('taskContextMenu');
    if (!contextMenu.contains(e.target)) {
      contextMenu.classList.remove('show');
    }
  });
  
  // Render initial list
  renderTodoList();
}

/**
 * Handle filter button click
 * @param {string} filter - Filter value (all, School, Personal)
 */
function handleFilterChange(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderTodoList();
}

/**
 * Render the to-do list
 */
function renderTodoList() {
  const todoList = document.getElementById('todoList');
  let tasks = getTodoTasks();
  
  // Apply filter
  if (currentFilter !== 'all') {
    tasks = tasks.filter(t => t.category === currentFilter);
  }
  
  // Sort by due date (tasks without dates at the end)
  tasks.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  
  if (tasks.length === 0) {
    todoList.innerHTML = `
      <div class="empty-state">
        <p>No tasks yet. Click "+" to add your first task!</p>
      </div>
    `;
    return;
  }
  
  todoList.innerHTML = tasks.map(task => `
    <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="todo-bullet"></div>
      <span class="todo-title">${escapeHtml(task.title)}</span>
      <div class="todo-line"></div>
      <span class="todo-date">${formatDate(task.dueDate)}</span>
      <div class="todo-checkbox ${task.completed ? 'checked' : ''}" 
           data-id="${task.id}" 
           onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
      </div>
    </div>
  `).join('');
  
  // Add click handlers for context menu
  todoList.querySelectorAll('.todo-item').forEach(item => {
    item.addEventListener('click', (e) => showTaskContextMenu(e, item.dataset.id));
  });
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date or empty string
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Toggle task completion status
 * @param {string} id - Task ID
 */
function toggleTaskComplete(id) {
  const tasks = getTodoTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    updateTodoTask(id, { completed: !task.completed });
    renderTodoList();
    updateHomeSummary();
  }
}

/**
 * Show context menu for a task
 * @param {Event} e - Click event
 * @param {string} taskId - Task ID
 */
function showTaskContextMenu(e, taskId) {
  e.preventDefault();
  selectedTaskId = taskId;
  
  const contextMenu = document.getElementById('taskContextMenu');
  
  // Position the menu near the click
  const x = Math.min(e.clientX, window.innerWidth - 160);
  const y = Math.min(e.clientY, window.innerHeight - 100);
  
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.add('show');
}

/**
 * Open task modal for adding/editing
 * @param {Object} task - Task to edit (optional)
 */
function openTaskModal(task = null) {
  isEditMode = !!task;
  selectedTaskId = task ? task.id : null;
  
  const modal = document.getElementById('taskModal');
  const title = document.getElementById('taskModalTitle');
  const titleInput = document.getElementById('taskTitleInput');
  const categorySelect = document.getElementById('taskCategorySelect');
  const dueDateInput = document.getElementById('taskDueDateInput');
  
  title.textContent = isEditMode ? 'Edit Task' : 'New Task';
  titleInput.value = task ? task.title : '';
  categorySelect.value = task ? task.category : 'School';
  dueDateInput.value = task ? task.dueDate || '' : '';
  
  modal.classList.add('show');
  titleInput.focus();
}

/**
 * Close task modal
 */
function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('show');
  document.getElementById('taskTitleInput').value = '';
  document.getElementById('taskDueDateInput').value = '';
  isEditMode = false;
  selectedTaskId = null;
}

/**
 * Handle task form submission
 */
function handleTaskSubmit() {
  const title = document.getElementById('taskTitleInput').value.trim();
  const category = document.getElementById('taskCategorySelect').value;
  const dueDate = document.getElementById('taskDueDateInput').value || null;
  
  if (!title) {
    alert('Please enter a task title');
    return;
  }
  
  if (isEditMode && selectedTaskId) {
    updateTodoTask(selectedTaskId, { title, category, dueDate });
  } else {
    addTodoTask({ title, category, dueDate });
  }
  
  closeTaskModal();
  renderTodoList();
  updateHomeSummary();
}

/**
 * Handle edit task from context menu
 */
function handleEditTask() {
  document.getElementById('taskContextMenu').classList.remove('show');
  
  const tasks = getTodoTasks();
  const task = tasks.find(t => t.id === selectedTaskId);
  if (task) {
    openTaskModal(task);
  }
}

/**
 * Handle delete task from context menu
 */
function handleDeleteTask() {
  document.getElementById('taskContextMenu').classList.remove('show');
  
  showConfirmModal(
    'Are you sure you want to delete this task?',
    () => {
      deleteTodoTask(selectedTaskId);
      renderTodoList();
      updateHomeSummary();
    }
  );
}
