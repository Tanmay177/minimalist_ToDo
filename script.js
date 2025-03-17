// Theme handling
const htmlElement = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

// Load theme from localStorage or default to dark mode
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlElement.classList.toggle('dark-mode', currentTheme === 'dark');

themeToggle.addEventListener('click', () => {
    const isDarkMode = htmlElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Initialize tasks from localStorage or empty arrays
let dailyTasks = [];
let generalTasks = JSON.parse(localStorage.getItem('generalTasks')) || [];

// Load and check daily tasks
function loadDailyTasks() {
    const savedDailyTasks = JSON.parse(localStorage.getItem('dailyTasks')) || [];
    const lastResetDate = localStorage.getItem('lastResetDate');
    const today = new Date().toDateString();

    if (lastResetDate !== today) {
        // It's a new day, reset daily tasks
        dailyTasks = [];
        localStorage.setItem('lastResetDate', today);
    } else {
        // Same day, load saved tasks
        dailyTasks = savedDailyTasks;
    }
}

// Check for midnight reset
function checkForReset() {
    const now = new Date();
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== now.toDateString()) {
        dailyTasks = [];
        localStorage.setItem('lastResetDate', now.toDateString());
        saveTasks();
        renderTasks();
    }
}

// Set up midnight check
function setupMidnightCheck() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow - now;
    
    // Initial check
    checkForReset();
    
    // Set up recurring check at midnight
    setInterval(checkForReset, 60000); // Check every minute
    
    // Set up the first midnight check
    setTimeout(() => {
        checkForReset();
        // After the first midnight, check every 24 hours
        setInterval(checkForReset, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
}

// DOM Elements
const dailyList = document.getElementById('daily-list');
const generalList = document.getElementById('general-list');
const taskInputs = document.querySelectorAll('.task-input');
const addButtons = document.querySelectorAll('.add-btn');

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('dailyTasks', JSON.stringify(dailyTasks));
    localStorage.setItem('generalTasks', JSON.stringify(generalTasks));
}

// Create task element
function createTaskElement(task, index, listType) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.index = index;
    li.dataset.type = listType;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    
    const taskDate = document.createElement('span');
    taskDate.className = 'task-date';
    taskDate.textContent = new Date(task.date).toLocaleDateString();
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    
    // Add event listeners for checkbox and delete
    checkbox.addEventListener('change', () => toggleTask(listType, index));
    deleteBtn.addEventListener('click', () => deleteTask(listType, index));
    
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(taskDate);
    li.appendChild(deleteBtn);
    
    // Add drag and drop event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    
    return li;
}

// Drag and drop handlers
let draggedItem = null;
let dragSourceList = null;

function handleDragStart(e) {
    draggedItem = e.target;
    dragSourceList = e.target.closest('.task-list');
    e.target.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(list => {
        list.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const list = e.target.closest('.task-list');
    if (list) {
        list.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const list = e.target.closest('.task-list');
    if (list) {
        list.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const list = e.target.closest('.task-list');
    if (!list) return;
    
    list.classList.remove('drag-over');
    const sourceIndex = parseInt(draggedItem.dataset.index);
    const sourceType = draggedItem.dataset.type;
    const targetType = list.dataset.type;
    
    // Get target index based on mouse position
    const afterElement = getDragAfterElement(list, e.clientY);
    const targetIndex = afterElement ? 
        parseInt(afterElement.dataset.index) :
        (targetType === 'daily' ? dailyTasks.length : generalTasks.length);
    
    // Move task between arrays
    const sourceTasks = sourceType === 'daily' ? dailyTasks : generalTasks;
    const targetTasks = targetType === 'daily' ? dailyTasks : generalTasks;
    
    const [movedTask] = sourceTasks.splice(sourceIndex, 1);
    
    // If moving to a different list
    if (sourceType !== targetType) {
        targetTasks.splice(targetIndex, 0, movedTask);
    } else {
        // Same list, just reorder
        sourceTasks.splice(targetIndex, 0, movedTask);
    }
    
    saveTasks();
    renderTasks();
}

function getDragAfterElement(list, y) {
    const draggableElements = [...list.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Add drag and drop listeners to lists
function setupDragAndDrop() {
    const lists = document.querySelectorAll('.task-list');
    lists.forEach(list => {
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('dragleave', handleDragLeave);
        list.addEventListener('drop', handleDrop);
    });
}

// Modify renderTasks to call setupDragAndDrop
function renderTasks() {
    dailyList.innerHTML = '';
    generalList.innerHTML = '';
    
    dailyTasks.forEach((task, index) => {
        const li = createTaskElement(task, index, 'daily');
        dailyList.appendChild(li);
    });
    
    generalTasks.forEach((task, index) => {
        const li = createTaskElement(task, index, 'general');
        generalList.appendChild(li);
    });
    
    setupDragAndDrop();
}

// Add new task
function addTask(type, text) {
    if (!text.trim()) return;
    
    const task = {
        text: text.trim(),
        completed: false,
        date: new Date().toISOString()
    };
    
    if (type === 'daily') {
        dailyTasks.push(task);
    } else {
        generalTasks.push(task);
    }
    
    saveTasks();
    renderTasks();
}

// Toggle task completion
function toggleTask(type, index) {
    const tasks = type === 'daily' ? dailyTasks : generalTasks;
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

// Delete task
function deleteTask(type, index) {
    const tasks = type === 'daily' ? dailyTasks : generalTasks;
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// Add event listeners to input fields and buttons
taskInputs.forEach((input, index) => {
    const type = index === 0 ? 'daily' : 'general';
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(type, input.value);
            input.value = '';
        }
    });
    
    addButtons[index].addEventListener('click', () => {
        addTask(type, input.value);
        input.value = '';
    });
});

// Initial render
renderTasks();

// Initialize the app
loadDailyTasks();
setupMidnightCheck(); 