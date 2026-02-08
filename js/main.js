/**
 * Main Application Module
 * Handles navigation, settings, and app initialization.
 */

// Current view state
let currentView = 'home';

/**
 * Initialize the application
 */
function initApp() {
  // Apply saved settings
  applySettings();
  
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });
  
  // Hamburger menu
  document.getElementById('hamburgerBtn').addEventListener('click', toggleDropdown);
  
  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdownMenu');
    const hamburger = document.getElementById('hamburgerBtn');
    if (!dropdown.contains(e.target) && !hamburger.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  // Menu items
  document.getElementById('deleteDataBtn').addEventListener('click', handleDeleteData);
  document.getElementById('customiseBtn').addEventListener('click', openCustomiseModal);
  document.getElementById('tutorialBtn').addEventListener('click', openTutorialModal);
  
  // Customisation modal
  document.getElementById('closeCustomiseModal').addEventListener('click', closeCustomiseModal);
  document.getElementById('saveCustomiseBtn').addEventListener('click', saveCustomisation);
  
  // Color options
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  
  // Tutorial modal
  document.getElementById('closeTutorialModal').addEventListener('click', closeTutorialModal);
  document.getElementById('gotItBtn').addEventListener('click', closeTutorialModal);
  
  // Confirm modal
  document.getElementById('closeConfirmModal').addEventListener('click', closeConfirmModal);
  document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);
  
  // Initialize modules
  initTodo();
  initCalendar();
  initNotes();
  initBoard();
  
  // Update home summary
  updateHomeSummary();
  
  // Check if first visit - show tutorial
  const settings = getAppSettings();
  if (!localStorage.getItem('tutorialShown')) {
    openTutorialModal();
    localStorage.setItem('tutorialShown', 'true');
  }
}

/**
 * Navigate to a view
 * @param {string} view - View name
 */
function navigateTo(view) {
  currentView = view;
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `${view}-view`);
  });
  
  // Close dropdown
  document.getElementById('dropdownMenu').classList.remove('show');
  
  // Refresh data when switching views
  if (view === 'home') {
    updateHomeSummary();
  } else if (view === 'todo') {
    renderTodoList();
  } else if (view === 'calendar') {
    renderCalendar();
  } else if (view === 'notes') {
    renderNotes();
  } else if (view === 'board') {
    resizeCanvas();
  }
}

/**
 * Update home summary stats
 */
function updateHomeSummary() {
  document.getElementById('pendingTasksCount').textContent = getPendingTasksCount();
  document.getElementById('notesCount').textContent = getNotesCount();
  document.getElementById('lastBoardName').textContent = getLastBoardName();
}

/**
 * Toggle hamburger dropdown
 */
function toggleDropdown() {
  const dropdown = document.getElementById('dropdownMenu');
  dropdown.classList.toggle('show');
}

/**
 * Handle delete all data
 */
function handleDeleteData() {
  document.getElementById('dropdownMenu').classList.remove('show');
  
  showConfirmModal(
    'This will delete all tasks, notes, calendar entries, and boards on this device. Are you sure?',
    () => {
      clearAllData();
      
      // Reset UI
      updateHomeSummary();
      renderTodoList();
      renderCalendar();
      renderNotes();
      updateFolderOptions();
      updateBoardSelect();
      
      // Clear board canvas
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      document.getElementById('boardElements').innerHTML = '';
      
      navigateTo('home');
    }
  );
}

/**
 * Apply saved settings
 */
function applySettings() {
  const settings = getAppSettings();
  
  // Font size
  if (settings.fontSize === 'large') {
    document.body.classList.add('large-font');
  } else {
    document.body.classList.remove('large-font');
  }
  
  // Accent color
  document.documentElement.style.setProperty('--accent-color', settings.accentColor);
}

/**
 * Open customisation modal
 */
function openCustomiseModal() {
  document.getElementById('dropdownMenu').classList.remove('show');
  
  const settings = getAppSettings();
  
  // Set font size radio
  document.querySelectorAll('input[name="fontSize"]').forEach(radio => {
    radio.checked = radio.value === settings.fontSize;
  });
  
  // Set color option
  document.querySelectorAll('.color-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.color === settings.accentColor);
  });
  
  document.getElementById('customiseModal').classList.add('show');
}

/**
 * Close customisation modal
 */
function closeCustomiseModal() {
  document.getElementById('customiseModal').classList.remove('show');
}

/**
 * Save customisation settings
 */
function saveCustomisation() {
  const fontSize = document.querySelector('input[name="fontSize"]:checked').value;
  const accentColor = document.querySelector('.color-option.selected').dataset.color;
  
  updateAppSettings({ fontSize, accentColor });
  applySettings();
  closeCustomiseModal();
}

/**
 * Open tutorial modal
 */
function openTutorialModal() {
  document.getElementById('dropdownMenu').classList.remove('show');
  document.getElementById('tutorialModal').classList.add('show');
}

/**
 * Close tutorial modal
 */
function closeTutorialModal() {
  document.getElementById('tutorialModal').classList.remove('show');
}

/**
 * Show confirm modal
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 */
let confirmCallback = null;

function showConfirmModal(message, onConfirm) {
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onConfirm;
  document.getElementById('confirmModal').classList.add('show');
  
  // Set up confirm button
  document.getElementById('confirmBtn').onclick = () => {
    closeConfirmModal();
    if (confirmCallback) {
      confirmCallback();
      confirmCallback = null;
    }
  };
}

/**
 * Close confirm modal
 */
function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('show');
  confirmCallback = null;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
