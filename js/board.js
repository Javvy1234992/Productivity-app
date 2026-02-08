/**
 * Board/Whiteboard Module
 * Handles whiteboard functionality including drawing, text, sticky notes, and images.
 * Supports multiple named boards with persistence.
 */

// Module state
let currentBoardId = null;
let currentTool = 'draw';
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let boardElements = [];

// Canvas reference
let canvas = null;
let ctx = null;

/**
 * Initialize the board module
 */
function initBoard() {
  // Canvas setup
  canvas = document.getElementById('boardCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  
  // Window resize
  window.addEventListener('resize', resizeCanvas);
  
  // Tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTool(btn.dataset.tool));
  });
  
  // Board selector
  document.getElementById('boardSelect').addEventListener('change', (e) => {
    if (e.target.value) {
      loadBoard(e.target.value);
    }
  });
  
  // Board management buttons
  document.getElementById('newBoardBtn').addEventListener('click', () => openBoardNameModal());
  document.getElementById('renameBoardBtn').addEventListener('click', handleRenameBoard);
  document.getElementById('deleteBoardBtn').addEventListener('click', handleDeleteBoard);
  
  // Board name modal
  document.getElementById('closeBoardNameModal').addEventListener('click', closeBoardNameModal);
  document.getElementById('cancelBoardNameBtn').addEventListener('click', closeBoardNameModal);
  document.getElementById('submitBoardNameBtn').addEventListener('click', handleBoardNameSubmit);
  
  // Export button
  document.getElementById('exportBoardBtn').addEventListener('click', exportBoard);
  
  // Drawing events
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);
  
  // Touch support
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', handleMouseUp);
  
  // Image upload
  document.getElementById('imageUploadInput').addEventListener('change', handleImageUpload);
  
  // Load boards list
  updateBoardSelect();
  
  // Load last opened board
  const settings = getAppSettings();
  if (settings.lastOpenedBoardId) {
    const board = getBoard(settings.lastOpenedBoardId);
    if (board) {
      loadBoard(settings.lastOpenedBoardId);
    }
  }
}

/**
 * Resize canvas to fit container
 */
function resizeCanvas() {
  const container = document.getElementById('boardCanvasContainer');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight || 500;
  
  // Redraw canvas content if there's a board loaded
  if (currentBoardId) {
    const board = getBoard(currentBoardId);
    if (board && board.data && board.data.canvasData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = board.data.canvasData;
    }
  }
}

/**
 * Select a tool
 * @param {string} tool - Tool name
 */
function selectTool(tool) {
  currentTool = tool;
  
  // Update button states
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  
  // Update cursor
  canvas.style.cursor = tool === 'draw' ? 'crosshair' : 'default';
  
  // Handle tool-specific actions
  if (tool === 'image') {
    document.getElementById('imageUploadInput').click();
  }
}

/**
 * Update board select dropdown
 */
function updateBoardSelect() {
  const select = document.getElementById('boardSelect');
  const boards = getBoards();
  
  select.innerHTML = '<option value="">Select a board...</option>';
  boards.forEach(board => {
    select.innerHTML += `<option value="${board.id}">${escapeHtml(board.name)}</option>`;
  });
  
  if (currentBoardId) {
    select.value = currentBoardId;
  }
}

/**
 * Load a board
 * @param {string} boardId - Board ID
 */
function loadBoard(boardId) {
  // Save current board first
  if (currentBoardId) {
    saveBoardState();
  }
  
  currentBoardId = boardId;
  const board = getBoard(boardId);
  if (!board) return;
  
  // Update last opened
  updateAppSettings({ lastOpenedBoardId: boardId });
  updateHomeSummary();
  
  // Clear canvas and elements
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('boardElements').innerHTML = '';
  boardElements = [];
  
  // Restore canvas data
  if (board.data && board.data.canvasData) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = board.data.canvasData;
  }
  
  // Restore elements
  if (board.data && board.data.elements) {
    board.data.elements.forEach(el => {
      createBoardElement(el.type, el.x, el.y, el.content, el.style);
    });
  }
  
  // Update select
  document.getElementById('boardSelect').value = boardId;
}

/**
 * Save current board state
 */
function saveBoardState() {
  if (!currentBoardId) return;
  
  const canvasData = canvas.toDataURL();
  const elements = boardElements.map(el => ({
    type: el.type,
    x: el.element.offsetLeft,
    y: el.element.offsetTop,
    content: el.element.textContent || el.element.src,
    style: el.style
  }));
  
  updateBoard(currentBoardId, {
    data: { canvasData, elements }
  });
}

/**
 * Handle mouse down on canvas
 * @param {MouseEvent} e 
 */
function handleMouseDown(e) {
  if (!currentBoardId) {
    alert('Please select or create a board first');
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (currentTool === 'draw') {
    isDrawing = true;
    lastX = x;
    lastY = y;
  } else if (currentTool === 'text') {
    createBoardElement('text', x, y);
  } else if (currentTool === 'sticky') {
    createBoardElement('sticky', x, y);
  }
}

/**
 * Handle mouse move on canvas
 * @param {MouseEvent} e 
 */
function handleMouseMove(e) {
  if (!isDrawing || currentTool !== 'draw') return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const color = document.getElementById('drawColor').value;
  const width = document.getElementById('drawWidth').value;
  
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  lastX = x;
  lastY = y;
}

/**
 * Handle mouse up
 */
function handleMouseUp() {
  if (isDrawing) {
    isDrawing = false;
    saveBoardState();
  }
}

/**
 * Handle touch start
 * @param {TouchEvent} e 
 */
function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  handleMouseDown(mouseEvent);
}

/**
 * Handle touch move
 * @param {TouchEvent} e 
 */
function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  handleMouseMove(mouseEvent);
}

/**
 * Create a board element (text, sticky, image)
 * @param {string} type - Element type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} content - Initial content
 * @param {Object} style - Style options
 */
function createBoardElement(type, x, y, content = '', style = {}) {
  const container = document.getElementById('boardElements');
  let element;
  
  if (type === 'text') {
    element = document.createElement('div');
    element.className = 'board-element board-text';
    element.contentEditable = true;
    element.textContent = content || 'Click to edit text';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  } else if (type === 'sticky') {
    element = document.createElement('div');
    element.className = 'board-element board-sticky';
    element.contentEditable = true;
    element.textContent = content || 'Sticky note';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  } else if (type === 'image') {
    element = document.createElement('img');
    element.className = 'board-element board-image';
    element.src = content;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.draggable = false;
  }
  
  if (element) {
    // Make draggable
    makeDraggable(element);
    
    container.appendChild(element);
    
    boardElements.push({
      type,
      element,
      style
    });
    
    // Save state on blur for text/sticky
    if (type === 'text' || type === 'sticky') {
      element.addEventListener('blur', () => saveBoardState());
    }
  }
}

/**
 * Make an element draggable
 * @param {HTMLElement} element 
 */
function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, initialX, initialY;
  
  element.addEventListener('mousedown', (e) => {
    if (e.target.isContentEditable && document.activeElement === e.target) {
      return; // Allow text editing
    }
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialX = element.offsetLeft;
    initialY = element.offsetTop;
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    element.style.left = `${initialX + dx}px`;
    element.style.top = `${initialY + dy}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      saveBoardState();
    }
  });
}

/**
 * Handle image upload
 * @param {Event} e 
 */
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!currentBoardId) {
    alert('Please select or create a board first');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    createBoardElement('image', 50, 50, event.target.result);
    saveBoardState();
  };
  reader.readAsDataURL(file);
  
  // Reset input
  e.target.value = '';
  
  // Switch to draw tool
  selectTool('draw');
}

/**
 * Open board name modal
 * @param {boolean} isRename - Whether renaming an existing board
 */
let isRenamingBoard = false;

function openBoardNameModal(isRename = false) {
  isRenamingBoard = isRename;
  
  const modal = document.getElementById('boardNameModal');
  const title = document.getElementById('boardNameModalTitle');
  const input = document.getElementById('boardNameInput');
  
  title.textContent = isRename ? 'Rename Board' : 'New Board';
  
  if (isRename && currentBoardId) {
    const board = getBoard(currentBoardId);
    input.value = board ? board.name : '';
  } else {
    input.value = '';
  }
  
  modal.classList.add('show');
  input.focus();
}

/**
 * Close board name modal
 */
function closeBoardNameModal() {
  document.getElementById('boardNameModal').classList.remove('show');
  document.getElementById('boardNameInput').value = '';
  isRenamingBoard = false;
}

/**
 * Handle board name form submission
 */
function handleBoardNameSubmit() {
  const name = document.getElementById('boardNameInput').value.trim();
  
  if (!name) {
    alert('Please enter a board name');
    return;
  }
  
  if (isRenamingBoard && currentBoardId) {
    updateBoard(currentBoardId, { name });
  } else {
    // Save current board first
    if (currentBoardId) {
      saveBoardState();
    }
    
    const board = addBoard(name);
    currentBoardId = board.id;
    
    // Clear canvas and elements
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('boardElements').innerHTML = '';
    boardElements = [];
    
    updateAppSettings({ lastOpenedBoardId: board.id });
  }
  
  closeBoardNameModal();
  updateBoardSelect();
  updateHomeSummary();
}

/**
 * Handle rename board
 */
function handleRenameBoard() {
  if (!currentBoardId) {
    alert('Please select a board first');
    return;
  }
  openBoardNameModal(true);
}

/**
 * Handle delete board
 */
function handleDeleteBoard() {
  if (!currentBoardId) {
    alert('Please select a board first');
    return;
  }
  
  showConfirmModal(
    'Are you sure you want to delete this board? This cannot be undone.',
    () => {
      deleteBoard(currentBoardId);
      currentBoardId = null;
      
      // Clear canvas and elements
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      document.getElementById('boardElements').innerHTML = '';
      boardElements = [];
      
      updateBoardSelect();
      updateHomeSummary();
    }
  );
}

/**
 * Export board as PNG image
 */
function exportBoard() {
  if (!currentBoardId) {
    alert('Please select or create a board first');
    return;
  }
  
  // Save state first
  saveBoardState();
  
  // Create a temporary canvas for export
  const container = document.getElementById('boardCanvasContainer');
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = container.clientWidth;
  exportCanvas.height = container.clientHeight;
  const exportCtx = exportCanvas.getContext('2d');
  
  // Draw background
  exportCtx.fillStyle = '#e7ecf2';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  
  // Draw dots pattern
  exportCtx.fillStyle = '#738fa7';
  for (let x = 10; x < exportCanvas.width; x += 20) {
    for (let y = 10; y < exportCanvas.height; y += 20) {
      exportCtx.beginPath();
      exportCtx.arc(x, y, 1, 0, Math.PI * 2);
      exportCtx.fill();
    }
  }
  
  // Draw the canvas content
  exportCtx.drawImage(canvas, 0, 0);
  
  // Draw elements (simplified - text and sticky notes)
  boardElements.forEach(el => {
    if (el.type === 'text' || el.type === 'sticky') {
      const rect = el.element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      
      if (el.type === 'sticky') {
        exportCtx.fillStyle = '#fff9c4';
        exportCtx.fillRect(x, y, rect.width, rect.height);
      }
      
      exportCtx.fillStyle = '#071330';
      exportCtx.font = '16px Arial, Helvetica, sans-serif';
      exportCtx.fillText(el.element.textContent, x + 8, y + 20);
    } else if (el.type === 'image') {
      const rect = el.element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      exportCtx.drawImage(el.element, x, y, rect.width, rect.height);
    }
  });
  
  // Download
  const board = getBoard(currentBoardId);
  const link = document.createElement('a');
  link.download = `${board ? board.name : 'board'}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}
