/**
 * Notes Module
 * Handles note creation, editing, searching, and folder filtering.
 */

// Module state
let currentNoteId = null;
let currentFolderFilter = 'all';
let currentSearchQuery = '';

/**
 * Initialize the notes module
 */
function initNotes() {
  // Search input
  document.getElementById('noteSearchInput').addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase();
    renderNotes();
  });
  
  // Folder filter
  document.getElementById('folderFilterSelect').addEventListener('change', (e) => {
    currentFolderFilter = e.target.value;
    renderNotes();
  });
  
  // Add note buttons
  document.getElementById('addNoteBtn').addEventListener('click', () => openNoteModal());
  document.getElementById('homeNewNoteBtn').addEventListener('click', () => openNoteModal());
  
  // Note modal events
  document.getElementById('closeNoteModal').addEventListener('click', closeNoteModal);
  document.getElementById('cancelNoteBtn').addEventListener('click', closeNoteModal);
  document.getElementById('submitNoteBtn').addEventListener('click', handleNoteSubmit);
  
  // Editor events
  document.getElementById('closeEditorBtn').addEventListener('click', closeEditor);
  document.getElementById('saveNoteBtn').addEventListener('click', saveCurrentNote);
  
  // Initial render
  renderNotes();
  updateFolderOptions();
}

/**
 * Update folder dropdown options
 */
function updateFolderOptions() {
  const select = document.getElementById('folderFilterSelect');
  const folders = getNoteFolders();
  
  // Keep "All folders" option, add others
  select.innerHTML = '<option value="all">All folders</option>';
  folders.forEach(folder => {
    select.innerHTML += `<option value="${escapeHtml(folder)}">${escapeHtml(folder)}</option>`;
  });
  
  // Restore current filter if still valid
  if (currentFolderFilter !== 'all' && !folders.includes(currentFolderFilter)) {
    currentFolderFilter = 'all';
  }
  select.value = currentFolderFilter;
}

/**
 * Render notes in sidebar and table
 */
function renderNotes() {
  const notes = getFilteredNotes();
  
  renderNotesSidebar(notes);
  renderNotesTable(notes);
}

/**
 * Get filtered notes based on search and folder
 * @returns {Array} Filtered notes
 */
function getFilteredNotes() {
  let notes = getNotes();
  
  // Filter by folder
  if (currentFolderFilter !== 'all') {
    notes = notes.filter(n => n.folder === currentFolderFilter);
  }
  
  // Filter by search query
  if (currentSearchQuery) {
    notes = notes.filter(n => 
      n.title.toLowerCase().includes(currentSearchQuery) ||
      n.body.toLowerCase().includes(currentSearchQuery)
    );
  }
  
  // Sort by updated date (newest first)
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  return notes;
}

/**
 * Render notes sidebar
 * @param {Array} notes - Notes to display
 */
function renderNotesSidebar(notes) {
  const sidebar = document.getElementById('notesSidebar');
  
  if (notes.length === 0) {
    sidebar.innerHTML = '<li class="empty-state" style="padding: 16px; text-align: center;">No notes found</li>';
    return;
  }
  
  sidebar.innerHTML = notes.map(note => `
    <li class="${note.id === currentNoteId ? 'active' : ''}" 
        data-id="${note.id}"
        onclick="openNoteEditor('${note.id}')">
      ${escapeHtml(note.title || 'Untitled')}
    </li>
  `).join('');
}

/**
 * Render notes table
 * @param {Array} notes - Notes to display
 */
function renderNotesTable(notes) {
  const tbody = document.getElementById('notesTableBody');
  
  if (notes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" style="text-align: center; color: var(--color-muted); padding: 40px;">
          No notes found. Create your first note!
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = notes.map(note => `
    <tr data-id="${note.id}" onclick="openNoteEditor('${note.id}')">
      <td>${escapeHtml(note.title || 'Untitled')}</td>
      <td>${escapeHtml(note.folder || '-')}</td>
    </tr>
  `).join('');
}

/**
 * Open note editor
 * @param {string} noteId - Note ID
 */
function openNoteEditor(noteId) {
  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;
  
  currentNoteId = noteId;
  
  // Update UI
  const listView = document.getElementById('notesListView');
  const editorView = document.getElementById('notesEditorView');
  const folderBadge = document.getElementById('editorFolderBadge');
  const titleInput = document.getElementById('editorTitle');
  const bodyInput = document.getElementById('editorBody');
  const folderInput = document.getElementById('editorFolder');
  
  folderBadge.textContent = `Folder: ${note.folder || 'None'}`;
  titleInput.value = note.title || '';
  bodyInput.value = note.body || '';
  folderInput.value = note.folder || '';
  
  listView.style.display = 'none';
  editorView.style.display = 'block';
  
  // Update sidebar selection
  renderNotes();
  
  titleInput.focus();
}

/**
 * Close editor and return to list view
 */
function closeEditor() {
  const listView = document.getElementById('notesListView');
  const editorView = document.getElementById('notesEditorView');
  
  currentNoteId = null;
  
  editorView.style.display = 'none';
  listView.style.display = 'block';
  
  renderNotes();
}

/**
 * Save the currently edited note
 */
function saveCurrentNote() {
  if (!currentNoteId) return;
  
  const title = document.getElementById('editorTitle').value.trim();
  const body = document.getElementById('editorBody').value;
  const folder = document.getElementById('editorFolder').value.trim() || null;
  
  updateNote(currentNoteId, { title, body, folder });
  
  // Update folder badge
  document.getElementById('editorFolderBadge').textContent = `Folder: ${folder || 'None'}`;
  
  // Refresh folder options and list
  updateFolderOptions();
  renderNotes();
  updateHomeSummary();
  
  // Show feedback
  const saveBtn = document.getElementById('saveNoteBtn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saved!';
  setTimeout(() => {
    saveBtn.textContent = originalText;
  }, 1000);
}

/**
 * Open note creation modal
 */
function openNoteModal() {
  const modal = document.getElementById('noteModal');
  document.getElementById('noteTitleInput').value = '';
  document.getElementById('noteBodyInput').value = '';
  document.getElementById('noteFolderInput').value = '';
  
  modal.classList.add('show');
  document.getElementById('noteTitleInput').focus();
}

/**
 * Close note creation modal
 */
function closeNoteModal() {
  document.getElementById('noteModal').classList.remove('show');
}

/**
 * Handle note creation form submission
 */
function handleNoteSubmit() {
  const title = document.getElementById('noteTitleInput').value.trim();
  const body = document.getElementById('noteBodyInput').value;
  const folder = document.getElementById('noteFolderInput').value.trim() || null;
  
  if (!title) {
    alert('Please enter a note title');
    return;
  }
  
  const note = addNote({ title, body, folder });
  
  closeNoteModal();
  updateFolderOptions();
  renderNotes();
  updateHomeSummary();
  
  // Open the newly created note
  openNoteEditor(note.id);
}

/**
 * Delete a note by ID
 * @param {string} noteId - Note ID
 */
function handleDeleteNote(noteId) {
  showConfirmModal(
    'Are you sure you want to delete this note?',
    () => {
      deleteNote(noteId);
      if (currentNoteId === noteId) {
        closeEditor();
      }
      updateFolderOptions();
      renderNotes();
      updateHomeSummary();
    }
  );
}
