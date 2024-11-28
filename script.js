let timer;
let isRunning = false;
let timeLeft = 25 * 60;
let currentInterval = 25;
let currentTimerType = 'main';
let notificationPermission = false;
let isDarkMode = false;
let analytics = {
    focusSessions: 0,
    focusMinutes: 0,
    tasksCompleted: 0,
    lastSession: null,
    currentStreak: 0
};

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function setTimerDuration(minutes) {
    if (!isRunning) {
        currentInterval = minutes;
        timeLeft = minutes * 60;
        updateTimerDisplay();
        
        const currentDropdown = document.getElementById(`${currentTimerType}-intervals`);
        currentDropdown.querySelector('.selected-time').textContent = `${minutes} min`;
        
        const dropdownContent = currentDropdown.querySelector('.dropdown-content');
        dropdownContent.classList.remove('show');
        currentDropdown.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
    }
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }

    Notification.requestPermission().then(permission => {
        notificationPermission = permission === "granted";
    });
}

function toggleTimer() {
    const button = document.querySelector('.start-pause');
    
    if (!isRunning) {
        isRunning = true;
        button.textContent = 'Pause';
        button.classList.add('paused');
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timer);
                isRunning = false;
                button.textContent = 'Start';
                button.classList.remove('paused');
                
                if (currentTimerType === 'main') {
                    analytics.focusSessions++;
                    analytics.focusMinutes += currentInterval;
                    
                    const today = new Date().toDateString();
                    if (analytics.lastSession !== today) {
                        analytics.currentStreak = analytics.lastSession ? analytics.currentStreak + 1 : 1;
                        analytics.lastSession = today;
                    }
                    
                    saveAnalytics();
                }
                
                if (notificationPermission) {
                    const message = currentTimerType === 'main' 
                        ? "Focus time is up! Time for a break." 
                        : "Break time is over! Ready to focus?";
                    
                    new Notification("Timer Complete", {
                        body: message,
                        icon: "https://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/clock-icon.png"
                    });
                }
                
                if (currentTimerType === 'main') {
                    alert('Focus time is up! Ready for a break?');
                    switchTimerType('break');
                } else {
                    alert('Break time is over! Ready to focus?');
                    switchTimerType('main');
                }
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isRunning = false;
        button.textContent = 'Start';
        button.classList.remove('paused');
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = currentInterval * 60;
    updateTimerDisplay();
    
    const button = document.querySelector('.start-pause');
    const timerDisplay = document.getElementById('timer');
    button.textContent = 'Start';
    button.classList.remove('paused');
    timerDisplay.classList.remove('running');
}

function switchTimerType(type) {
    clearInterval(timer);
    isRunning = false;
    
    currentTimerType = type;
    
    document.querySelectorAll('.timer-type').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(type)) {
            btn.classList.add('active');
        }
    });
    
    document.body.style.transition = 'background-color 0.3s ease';
    const bgColor = isDarkMode 
        ? (type === 'main' ? '#1a202c' : '#1c2a25')
        : (type === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;
    
    document.getElementById('main-intervals').style.display = 
        type === 'main' ? 'inline-block' : 'none';
    document.getElementById('break-intervals').style.display = 
        type === 'break' ? 'inline-block' : 'none';
    
    currentInterval = type === 'main' ? 25 : 5;
    timeLeft = currentInterval * 60;
    updateTimerDisplay();
    
    const button = document.querySelector('.start-pause');
    button.textContent = 'Start';
    button.classList.remove('paused');
    
    const dropdown = document.getElementById(`${type}-intervals`);
    dropdown.querySelector('.selected-time').textContent = `${currentInterval} min`;
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    const bgColor = isDarkMode 
        ? (currentTimerType === 'main' ? '#1a202c' : '#1c2a25')
        : (currentTimerType === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
        const bgColor = currentTimerType === 'main' ? '#1a202c' : '#1c2a25';
        document.body.style.backgroundColor = bgColor;
    }
    
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            requestNotificationPermission();
        }
        notificationPermission = Notification.permission === "granted";
    }

    setupDropdowns();
    loadTasks();
    
    const todoInput = document.getElementById('todo-input');
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
});

function applyCustomInterval(input) {
    const minutes = parseInt(input.value);
    if (minutes && minutes > 0 && minutes <= 120) {
        setTimerDuration(minutes);
        input.value = '';
    } else {
        alert('Please enter a valid time between 1 and 120 minutes.');
    }
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text) {
        addTodoFromData({
            text: text,
            completed: false
        });
        input.value = '';
        saveTasks();
    }
}

function handleDragStart(e) {
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    saveTasks();
}

function handleDragOver(e) {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const todoList = document.getElementById('todo-list');
    const siblings = [...todoList.querySelectorAll('.todo-item:not(.dragging)')];
    
    siblings.forEach(item => item.classList.remove('drag-over'));
    
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;
        if (offset < 0) {
            sibling.classList.add('drag-over');
            return true;
        }
        return false;
    });
    
    if (nextSibling) {
        todoList.insertBefore(draggingItem, nextSibling);
    } else {
        todoList.appendChild(draggingItem);
        const lastSibling = siblings[siblings.length - 1];
        if (lastSibling) {
            lastSibling.classList.add('drag-over');
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const existingTasks = document.querySelectorAll('.todo-item');
    existingTasks.forEach(task => {
        task.draggable = true;
        task.addEventListener('dragstart', handleDragStart);
        task.addEventListener('dragend', handleDragEnd);
        task.addEventListener('dragover', handleDragOver);
        task.addEventListener('drop', handleDrop);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todo-input');
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
});

function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-button');
        const content = dropdown.querySelector('.dropdown-content');
        const arrow = button.querySelector('i');
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            dropdowns.forEach(other => {
                if (other !== dropdown) {
                    other.querySelector('.dropdown-content').classList.remove('show');
                    other.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
                }
            });
            
            content.classList.toggle('show');
            arrow.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
        });
    });
    
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            const arrow = dropdown.querySelector('.dropdown-button i');
            content.classList.remove('show');
            arrow.style.transform = 'rotate(0)';
        });
    });
    
    const customInputs = document.querySelectorAll('.custom-interval input');
    customInputs.forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyCustomInterval(input);
                const dropdown = input.closest('.dropdown');
                dropdown.querySelector('.dropdown-content').classList.remove('show');
                dropdown.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
            }
        });
    });
}

function saveTasks() {
    try {
        const todoList = document.getElementById('todo-list');
        const tasks = [];
        
        todoList.querySelectorAll('.todo-item').forEach(item => {
            tasks.push({
                text: item.querySelector('.todo-text').textContent,
                completed: item.querySelector('.todo-checkbox').classList.contains('checked')
            });
        });
        
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        tasks.forEach(task => {
            addTodoFromData(task);
        });
    }
}

function addTodoFromData(taskData) {
    const todoList = document.getElementById('todo-list');
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.draggable = true;
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '<span></span>';
    
    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox';
    if (taskData.completed) {
        checkbox.classList.add('checked');
    }
    
    checkbox.onclick = function() {
        this.classList.toggle('checked');
        textSpan.classList.toggle('completed');
        if (this.classList.contains('checked')) {
            analytics.tasksCompleted++;
            saveAnalytics();
        }
        saveTasks();
    };
    
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    if (taskData.completed) {
        textSpan.classList.add('completed');
    }
    textSpan.textContent = sanitizeInput(taskData.text);
    
    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fas fa-times delete-task';
    deleteBtn.onclick = function() {
        li.remove();
        saveTasks();
    };
    
    li.appendChild(dragHandle);
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    
    todoList.appendChild(li);
}

function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function checkStorageLimit() {
    const totalSize = new Blob([localStorage.getItem('todoTasks')]).size;
    const limit = 5 * 1024 * 1024;
    return totalSize < limit;
} 

function loadAnalytics() {
    const savedAnalytics = localStorage.getItem('pomoAnalytics');
    if (savedAnalytics) {
        analytics = JSON.parse(savedAnalytics);
        updateAnalyticsDisplay();
    }
}

function saveAnalytics() {
    localStorage.setItem('pomoAnalytics', JSON.stringify(analytics));
    updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
    document.getElementById('totalFocusSessions').textContent = analytics.focusSessions;
    document.getElementById('totalFocusMinutes').textContent = analytics.focusMinutes;
    document.getElementById('tasksCompleted').textContent = analytics.tasksCompleted;
    document.getElementById('currentStreak').textContent = analytics.currentStreak;
}

function toggleAnalytics() {
    const modal = document.querySelector('.analytics-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        updateAnalyticsDisplay();
        modal.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    
    const modal = document.querySelector('.analytics-modal');
    const modalContent = document.querySelector('.analytics-content');
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

function toggleIntervalModal() {
    const modal = document.querySelector('.interval-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        updateIntervalOptions();
        modal.style.display = 'flex';
    }
}

function updateIntervalOptions() {
    const modal = document.querySelector('.interval-modal');
    const options = modal.querySelectorAll('.interval-option');
    
    if (currentTimerType === 'break') {
        options.forEach(option => {
            const minutes = parseInt(option.dataset.minutes);
            if (minutes === 5 || minutes === 15) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    } else {
        options.forEach(option => {
            option.style.display = 'block';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const intervalButtons = document.querySelectorAll('.interval-button');
    const intervalModal = document.querySelector('.interval-modal');
    const intervalContent = document.querySelector('.interval-content');
    
    intervalButtons.forEach(button => {
        button.addEventListener('click', toggleIntervalModal);
    });
    
    intervalModal.addEventListener('click', (e) => {
        if (e.target === intervalModal) {
            intervalModal.style.display = 'none';
        }
    });
    
    intervalContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    const intervalOptions = document.querySelectorAll('.interval-option');
    intervalOptions.forEach(option => {
        option.addEventListener('click', () => {
            const minutes = parseInt(option.dataset.minutes);
            setTimerDuration(minutes);
            intervalModal.style.display = 'none';
        });
    });
    
    const customInput = document.querySelector('.custom-interval-input input');
    
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const minutes = parseInt(customInput.value);
            if (minutes && minutes > 0 && minutes <= 120) {
                setTimerDuration(minutes);
                customInput.value = '';
                
                const intervalModal = document.querySelector('.interval-modal');
                intervalModal.style.display = 'none';
            } else {
                alert('Please enter a valid time between 1 and 120 minutes.');
            }
        }
    });
    
    document.querySelectorAll('.interval-modal .close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.interval-modal').style.display = 'none';
        });
    });
}); 
