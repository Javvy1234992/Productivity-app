/**
 * Storage Module
 * Handles all localStorage operations for the productivity app.
 * All data is stored locally - no server required.
 */

// Storage keys
const STORAGE_KEYS = {
  TODO_TASKS: 'todoTasks',
  CALENDAR_DAYS: 'calendarDays',
  NOTES: 'notes',
  BOARDS: 'boards',
  APP_SETTINGS: 'appSettings'
};

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Get current ISO date string
 * @returns {string} ISO date string
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed data or default value
 */
function loadState(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save
 */
function saveState(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

/**
 * Clear all app data from localStorage
 */
function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// ===== TO-DO TASKS =====

/**
 * Get all to-do tasks
 * @returns {Array} Array of task objects
 */
function getTodoTasks() {
  return loadState(STORAGE_KEYS.TODO_TASKS, []);
}

/**
 * Save all to-do tasks
 * @param {Array} tasks - Array of task objects
 */
function saveTodoTasks(tasks) {
  saveState(STORAGE_KEYS.TODO_TASKS, tasks);
}

/**
 * Add a new to-do task
 * @param {Object} task - Task object with title, category, dueDate
 * @returns {Object} Created task with id and timestamps
 */
function addTodoTask(task) {
  const tasks = getTodoTasks();
  const newTask = {
    id: generateId(),
    title: task.title,
    category: task.category || 'Other',
    dueDate: task.dueDate || null,
    completed: false,
    createdAt: getCurrentTimestamp()
  };
  tasks.push(newTask);
  saveTodoTasks(tasks);
  return newTask;
}

/**
 * Update a to-do task
 * @param {string} id - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated task or null if not found
 */
function updateTodoTask(id, updates) {
  const tasks = getTodoTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  tasks[index] = { ...tasks[index], ...updates };
  saveTodoTasks(tasks);
  return tasks[index];
}

/**
 * Delete a to-do task
 * @param {string} id - Task ID
 * @returns {boolean} True if deleted
 */
function deleteTodoTask(id) {
  const tasks = getTodoTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  
  saveTodoTasks(filtered);
  return true;
}

/**
 * Get pending tasks count
 * @returns {number} Count of incomplete tasks
 */
function getPendingTasksCount() {
  const tasks = getTodoTasks();
  return tasks.filter(t => !t.completed).length;
}

// ===== CALENDAR DAYS =====

/**
 * Get all calendar days with tasks
 * @returns {Array} Array of day objects
 */
function getCalendarDays() {
  return loadState(STORAGE_KEYS.CALENDAR_DAYS, []);
}

/**
 * Save all calendar days
 * @param {Array} days - Array of day objects
 */
function saveCalendarDays(days) {
  saveState(STORAGE_KEYS.CALENDAR_DAYS, days);
}

/**
 * Get or create a calendar day
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Day object
 */
function getCalendarDay(date) {
  const days = getCalendarDays();
  let day = days.find(d => d.date === date);
  
  if (!day) {
    day = {
      id: generateId(),
      date: date,
      tasks: []
    };
    days.push(day);
    saveCalendarDays(days);
  }
  
  return day;
}

/**
 * Add a task to a calendar day
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} text - Task text
 * @returns {Object} Created task
 */
function addCalendarTask(date, text) {
  const days = getCalendarDays();
  let dayIndex = days.findIndex(d => d.date === date);
  
  if (dayIndex === -1) {
    days.push({
      id: generateId(),
      date: date,
      tasks: []
    });
    dayIndex = days.length - 1;
  }
  
  const newTask = {
    id: generateId(),
    text: text,
    completed: false,
    createdAt: getCurrentTimestamp()
  };
  
  days[dayIndex].tasks.push(newTask);
  saveCalendarDays(days);
  return newTask;
}

/**
 * Update a calendar task
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated task or null
 */
function updateCalendarTask(date, taskId, updates) {
  const days = getCalendarDays();
  const day = days.find(d => d.date === date);
  if (!day) return null;
  
  const taskIndex = day.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return null;
  
  day.tasks[taskIndex] = { ...day.tasks[taskIndex], ...updates };
  saveCalendarDays(days);
  return day.tasks[taskIndex];
}

/**
 * Delete a calendar task
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} taskId - Task ID
 * @returns {boolean} True if deleted
 */
function deleteCalendarTask(date, taskId) {
  const days = getCalendarDays();
  const day = days.find(d => d.date === date);
  if (!day) return false;
  
  const originalLength = day.tasks.length;
  day.tasks = day.tasks.filter(t => t.id !== taskId);
  
  if (day.tasks.length === originalLength) return false;
  
  saveCalendarDays(days);
  return true;
}

/**
 * Check if a date has tasks
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if day has tasks
 */
function dateHasTasks(date) {
  const days = getCalendarDays();
  const day = days.find(d => d.date === date);
  return day && day.tasks.length > 0;
}

// ===== NOTES =====

/**
 * Get all notes
 * @returns {Array} Array of note objects
 */
function getNotes() {
  return loadState(STORAGE_KEYS.NOTES, []);
}

/**
 * Save all notes
 * @param {Array} notes - Array of note objects
 */
function saveNotes(notes) {
  saveState(STORAGE_KEYS.NOTES, notes);
}

/**
 * Add a new note
 * @param {Object} note - Note object with title, body, folder
 * @returns {Object} Created note with id and timestamps
 */
function addNote(note) {
  const notes = getNotes();
  const timestamp = getCurrentTimestamp();
  const newNote = {
    id: generateId(),
    title: note.title || 'Untitled',
    body: note.body || '',
    folder: note.folder || null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
}

/**
 * Update a note
 * @param {string} id - Note ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated note or null if not found
 */
function updateNote(id, updates) {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) return null;
  
  notes[index] = { 
    ...notes[index], 
    ...updates,
    updatedAt: getCurrentTimestamp()
  };
  saveNotes(notes);
  return notes[index];
}

/**
 * Delete a note
 * @param {string} id - Note ID
 * @returns {boolean} True if deleted
 */
function deleteNote(id) {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  if (filtered.length === notes.length) return false;
  
  saveNotes(filtered);
  return true;
}

/**
 * Get all unique folders
 * @returns {Array} Array of folder names
 */
function getNoteFolders() {
  const notes = getNotes();
  const folders = new Set();
  notes.forEach(n => {
    if (n.folder) folders.add(n.folder);
  });
  return Array.from(folders).sort();
}

/**
 * Get notes count
 * @returns {number} Total notes count
 */
function getNotesCount() {
  return getNotes().length;
}

// ===== BOARDS =====

/**
 * Get all boards
 * @returns {Array} Array of board objects
 */
function getBoards() {
  return loadState(STORAGE_KEYS.BOARDS, []);
}

/**
 * Save all boards
 * @param {Array} boards - Array of board objects
 */
function saveBoards(boards) {
  saveState(STORAGE_KEYS.BOARDS, boards);
}

/**
 * Get a board by ID
 * @param {string} id - Board ID
 * @returns {Object|null} Board object or null
 */
function getBoard(id) {
  const boards = getBoards();
  return boards.find(b => b.id === id) || null;
}

/**
 * Add a new board
 * @param {string} name - Board name
 * @returns {Object} Created board
 */
function addBoard(name) {
  const boards = getBoards();
  const timestamp = getCurrentTimestamp();
  const newBoard = {
    id: generateId(),
    name: name || 'Untitled Board',
    createdAt: timestamp,
    updatedAt: timestamp,
    data: {
      elements: [],
      canvasData: null
    }
  };
  boards.push(newBoard);
  saveBoards(boards);
  return newBoard;
}

/**
 * Update a board
 * @param {string} id - Board ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated board or null
 */
function updateBoard(id, updates) {
  const boards = getBoards();
  const index = boards.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  boards[index] = { 
    ...boards[index], 
    ...updates,
    updatedAt: getCurrentTimestamp()
  };
  saveBoards(boards);
  return boards[index];
}

/**
 * Delete a board
 * @param {string} id - Board ID
 * @returns {boolean} True if deleted
 */
function deleteBoard(id) {
  const boards = getBoards();
  const filtered = boards.filter(b => b.id !== id);
  if (filtered.length === boards.length) return false;
  
  saveBoards(filtered);
  
  // Clear last opened if it was this board
  const settings = getAppSettings();
  if (settings.lastOpenedBoardId === id) {
    updateAppSettings({ lastOpenedBoardId: null });
  }
  
  return true;
}

// ===== APP SETTINGS =====

/**
 * Get app settings
 * @returns {Object} Settings object
 */
function getAppSettings() {
  return loadState(STORAGE_KEYS.APP_SETTINGS, {
    fontSize: 'normal',
    accentColor: '#083b69',
    lastOpenedBoardId: null
  });
}

/**
 * Update app settings
 * @param {Object} updates - Settings to update
 * @returns {Object} Updated settings
 */
function updateAppSettings(updates) {
  const settings = getAppSettings();
  const newSettings = { ...settings, ...updates };
  saveState(STORAGE_KEYS.APP_SETTINGS, newSettings);
  return newSettings;
}

/**
 * Get last opened board name
 * @returns {string} Board name or "None yet"
 */
function getLastBoardName() {
  const settings = getAppSettings();
  if (!settings.lastOpenedBoardId) return 'None yet';
  
  const board = getBoard(settings.lastOpenedBoardId);
  return board ? board.name : 'None yet';
}
