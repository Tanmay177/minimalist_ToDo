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
let dailyTasks = JSON.parse(localStorage.getItem('dailyTasks')) || [];
let generalTasks = JSON.parse(localStorage.getItem('generalTasks')) || [];

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
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
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
    
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(taskDate);
    li.appendChild(deleteBtn);
    
    return li;
}

// Render tasks
function renderTasks() {
    dailyList.innerHTML = '';
    generalList.innerHTML = '';
    
    dailyTasks.forEach((task, index) => {
        const li = createTaskElement(task);
        
        // Add event listeners
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask('daily', index));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask('daily', index));
        
        dailyList.appendChild(li);
    });
    
    generalTasks.forEach((task, index) => {
        const li = createTaskElement(task);
        
        // Add event listeners
        li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask('general', index));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTask('general', index));
        
        generalList.appendChild(li);
    });
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