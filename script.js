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
let lastFocusInterval = 25;
let lastBreakInterval = 5;

// Updates the timer display with current minutes and seconds
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Sets a new duration for the timer when not running
function setTimerDuration(minutes) {
    if (!isRunning) {
        currentInterval = minutes;
        if (currentTimerType === 'main') {
            lastFocusInterval = minutes;
        } else {
            lastBreakInterval = minutes;
        }
        timeLeft = minutes * 60;
        updateTimerDisplay();
        
        const currentDropdown = document.getElementById(`${currentTimerType}-intervals`);
        currentDropdown.querySelector('.selected-time').textContent = `${minutes} minutes`;
        
        const dropdownContent = currentDropdown.querySelector('.dropdown-content');
        if (dropdownContent) {
            dropdownContent.classList.remove('show');
            currentDropdown.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
        }
        
        const intervalModal = document.querySelector('.interval-modal');
        if (intervalModal) {
            intervalModal.style.display = 'none';
        }
    }
}

// Requests permission for browser notifications
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }

    Notification.requestPermission().then(permission => {
        notificationPermission = permission === "granted";
    });
}

// Handles starting, pausing, and completing timer cycles
function toggleTimer() {
    const button = document.querySelector('.start-pause');
    const skipButton = document.querySelector('.skip-session');
    
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

// Resets timer to initial state
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = currentInterval * 60;
    updateTimerDisplay();
    
    const button = document.querySelector('.start-pause');
    const skipButton = document.querySelector('.skip-session');
    const timerDisplay = document.getElementById('timer');
    
    button.textContent = 'Start';
    button.classList.remove('paused');
    timerDisplay.classList.remove('running');
    
    if (skipButton) {
        skipButton.style.display = 'block';
        skipButton.title = currentTimerType === 'main' ? 'Skip to break' : 'Skip to focus';
    }
}

// Switches between focus and break sessions
function switchTimerType(type) {
    clearInterval(timer);
    isRunning = false;
    
    currentTimerType = type;
    
    const skipButton = document.querySelector('.skip-session');
    if (skipButton) {
        skipButton.style.display = 'block';
        skipButton.title = type === 'main' ? 'Skip to break' : 'Skip to focus';
    }
    
    document.querySelectorAll('.timer-type').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = type === 'main' 
        ? document.querySelector('.timer-type:first-child')
        : document.querySelector('.timer-type:last-child');
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    document.body.style.transition = 'background-color 0.3s ease';
    const bgColor = isDarkMode 
        ? (type === 'main' ? '#1a202c' : '#1c2a25')
        : (type === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;
    
    const intervalContent = document.querySelector('.interval-content');
    if (intervalContent) {
        intervalContent.style.backgroundColor = bgColor;
        const buttons = intervalContent.querySelectorAll('.interval-option, .close-modal');
        buttons.forEach(button => {
            button.style.backgroundColor = (!isDarkMode && type === 'break') ? '#67bf98' : '';
        });
    }
    
    document.getElementById('main-intervals').style.display = 
        type === 'main' ? 'inline-block' : 'none';
    document.getElementById('break-intervals').style.display = 
        type === 'break' ? 'inline-block' : 'none';
    
    if (type === 'main') {
        currentInterval = lastFocusInterval;
    } else {
        currentInterval = lastBreakInterval;
    }
    timeLeft = currentInterval * 60;
    updateTimerDisplay();
    
    const button = document.querySelector('.start-pause');
    button.textContent = 'Start';
    button.classList.remove('paused');
    
    const dropdown = document.getElementById(`${type}-intervals`);
    dropdown.querySelector('.selected-time').textContent = `${currentInterval} minutes`;
}

// Toggles between light and dark themes
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    const bgColor = isDarkMode 
        ? (currentTimerType === 'main' ? '#1a202c' : '#1c2a25')
        : (currentTimerType === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;
    
    const intervalContent = document.querySelector('.interval-content');
    if (intervalContent) {
        intervalContent.style.backgroundColor = bgColor;
        const buttons = intervalContent.querySelectorAll('.interval-option, .close-modal');
        buttons.forEach(button => {
            button.style.backgroundColor = (!isDarkMode && currentTimerType === 'break') ? '#67bf98' : '';
        });
    }

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
        const bgColor = currentTimerType === 'main' ? '#1a202c' : '#1c2a25';
        document.body.style.backgroundColor = bgColor;
        
        const intervalContent = document.querySelector('.interval-content');
        if (intervalContent) {
            intervalContent.style.backgroundColor = bgColor;
            const buttons = intervalContent.querySelectorAll('.interval-option, .close-modal');
            buttons.forEach(button => {
                button.style.backgroundColor = (!isDarkMode && currentTimerType === 'break') ? '#67bf98' : '';
            });
        }
    } else {
        const bgColor = currentTimerType === 'main' ? '#e6eeff' : '#e6fff0';
        const intervalContent = document.querySelector('.interval-content');
        if (intervalContent) {
            intervalContent.style.backgroundColor = bgColor;
            const buttons = intervalContent.querySelectorAll('.interval-option, .close-modal');
            buttons.forEach(button => {
                button.style.backgroundColor = (!isDarkMode && currentTimerType === 'break') ? '#67bf98' : '';
            });
        }
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
    
    const buttonsContainer = document.querySelector('.buttons');
    const resetButton = document.querySelector('.icon-button');
    
    const skipButton = document.createElement('button');
    skipButton.className = 'icon-button skip-session';
    skipButton.innerHTML = '<i class="fas fa-forward"></i>';
    skipButton.title = 'Skip to break';
    skipButton.onclick = skipSession;
    
    buttonsContainer.insertBefore(skipButton, resetButton);
});

// Applies custom interval duration from user input
function applyCustomInterval(input) {
    const minutes = parseInt(input.value);
    if (minutes && minutes > 0 && minutes <= 120) {
        setTimerDuration(minutes);
        input.value = '';
    } else {
        alert('Please enter a valid time between 1 and 120 minutes.');
    }
}

// Adds a new todo item to the list
function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (text) {
        addTodoFromData({
            text: text,
            completed: false,
            hasBeenCounted: false
        });
        input.value = '';
        saveTasks();
    }
}

// Handles the start of drag operations for todo items
function handleDragStart(e) {
    e.target.classList.add('dragging');
}

// Handles the end of drag operations for todo items
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    saveTasks();
}

// Handles the dragging over state for todo items
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

// Handles the drop event for todo items
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

// Sets up dropdown menus for timer intervals
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

// Saves todo items to local storage
function saveTasks() {
    try {
        const todoList = document.getElementById('todo-list');
        const tasks = [];
        
        todoList.querySelectorAll('.todo-item').forEach(item => {
            tasks.push({
                text: item.querySelector('.todo-text').textContent,
                completed: item.querySelector('.todo-checkbox').classList.contains('checked'),
                hasBeenCounted: item.dataset.counted === 'true'
            });
        });
        
        localStorage.setItem('todoTasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

// Loads todo items from local storage
function loadTasks() {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
        const tasks = JSON.parse(savedTasks);
        tasks.forEach(task => {
            addTodoFromData(task);
        });
    }
}

// Creates and adds a new todo item from data
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
    
    li.dataset.counted = taskData.hasBeenCounted || false;
    
    checkbox.onclick = function() {
        this.classList.toggle('checked');
        textSpan.classList.toggle('completed');
        const isChecked = this.classList.contains('checked');
        
        if (isChecked && li.dataset.counted === 'false') {
            analytics.tasksCompleted++;
            li.dataset.counted = 'true';
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
        showDeleteConfirmation(li);
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

// Sanitizes user input to prevent XSS
function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Checks if local storage limit is reached
function checkStorageLimit() {
    const totalSize = new Blob([localStorage.getItem('todoTasks')]).size;
    const limit = 5 * 1024 * 1024;
    return totalSize < limit;
} 

// Loads analytics data from local storage
function loadAnalytics() {
    const savedAnalytics = localStorage.getItem('pomoAnalytics');
    if (savedAnalytics) {
        analytics = JSON.parse(savedAnalytics);
        updateAnalyticsDisplay();
    }
}

// Saves analytics data to local storage
function saveAnalytics() {
    localStorage.setItem('pomoAnalytics', JSON.stringify(analytics));
    updateAnalyticsDisplay();
}

// Updates the analytics display in the modal
function updateAnalyticsDisplay() {
    document.getElementById('totalFocusSessions').textContent = analytics.focusSessions;
    document.getElementById('totalFocusMinutes').textContent = analytics.focusMinutes;
    document.getElementById('tasksCompleted').textContent = analytics.tasksCompleted;
    document.getElementById('currentStreak').textContent = analytics.currentStreak;
}

// Toggles the analytics modal visibility
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

// Toggles the interval selection modal visibility
function toggleIntervalModal() {
    const modal = document.querySelector('.interval-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

// Updates available interval options based on session type
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
        });
    });
    
    const customInput = document.querySelector('.custom-interval-input input');
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const minutes = parseInt(customInput.value);
            if (minutes && minutes > 0 && minutes <= 120) {
                setTimerDuration(minutes);
                customInput.value = '';
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

// Handles skipping current session and updates analytics
function skipSession() {
    if (currentTimerType === 'main') {
        const minutesSpent = (currentInterval * 60 - timeLeft) / 60;
        if (minutesSpent > 0) {
            analytics.focusMinutes += Math.round(minutesSpent);
            saveAnalytics();
        }
    }
    
    clearInterval(timer);
    isRunning = false;
    switchTimerType(currentTimerType === 'main' ? 'break' : 'main');
}

function toggleInfo() {
    const modal = document.querySelector('.info-modal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'flex';
    }
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    const infoModal = document.querySelector('.info-modal');
    const infoContent = document.querySelector('.info-content');
    
    infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.style.display = 'none';
        }
    });
    
    infoContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// Add this function to handle the delete confirmation
function showDeleteConfirmation(taskElement) {
    const modal = document.querySelector('.delete-confirm-modal');
    modal.style.display = 'flex';

    const handleDelete = (confirm) => {
        if (confirm) {
            taskElement.remove();
            saveTasks();
        }
        modal.style.display = 'none';
        
        // Remove event listeners
        modal.querySelector('.delete-confirm-yes').removeEventListener('click', deleteYes);
        modal.querySelector('.delete-confirm-no').removeEventListener('click', deleteNo);
        modal.removeEventListener('click', modalClick);
    };

    const deleteYes = () => handleDelete(true);
    const deleteNo = () => handleDelete(false);
    const modalClick = (e) => {
        if (e.target === modal) {
            handleDelete(false);
        }
    };

    // Add event listeners
    modal.querySelector('.delete-confirm-yes').addEventListener('click', deleteYes);
    modal.querySelector('.delete-confirm-no').addEventListener('click', deleteNo);
    modal.addEventListener('click', modalClick);
}
