let timer;
let isRunning = false;
let timeLeft = 25 * 60;
let currentInterval = 25;
let currentTimerType = 'main';
let notificationPermission = false;
let isDarkMode = false;

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
        
        // Update dropdown button text
        const currentDropdown = document.getElementById(`${currentTimerType}-intervals`);
        currentDropdown.querySelector('.selected-time').textContent = `${minutes} min`;
        
        // Close dropdown and reset arrow icon
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
                
                // Send notification when timer ends
                if (notificationPermission) {
                    const message = currentTimerType === 'main' 
                        ? "Focus time is up! Time for a break." 
                        : "Break time is over! Ready to focus?";
                    
                    new Notification("Timer Complete", {
                        body: message,
                        icon: "https://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/clock-icon.png"
                    });
                }
                
                alert('Time is Up!');
            }
        }, 1000);
    } else {
        // Pause timer
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
    
    // Reset button state
    const button = document.querySelector('.start-pause');
    const timerDisplay = document.getElementById('timer');
    button.textContent = 'Start';
    button.classList.remove('paused');
    timerDisplay.classList.remove('running');
}

function switchTimerType(type) {
    if (isRunning) {
        return;
    }
    
    currentTimerType = type;
    
    // Update button states
    document.querySelectorAll('.timer-type').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(type)) {
            btn.classList.add('active');
        }
    });
    
    // Change background color based on timer type and theme
    document.body.style.transition = 'background-color 0.3s ease';
    const bgColor = isDarkMode 
        ? (type === 'main' ? '#1a202c' : '#1c2a25')
        : (type === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;
    
    // Show/hide appropriate interval dropdowns
    document.getElementById('main-intervals').style.display = 
        type === 'main' ? 'inline-block' : 'none';
    document.getElementById('break-intervals').style.display = 
        type === 'break' ? 'inline-block' : 'none';
    
    // Reset timer to default value for the selected type
    currentInterval = type === 'main' ? 25 : 5;
    resetTimer();
    
    // Update dropdown text
    const dropdown = document.getElementById(`${type}-intervals`);
    dropdown.querySelector('.selected-time').textContent = `${currentInterval} min`;
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update theme toggle icon
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    
    // Update background color based on current timer type
    const bgColor = isDarkMode 
        ? (currentTimerType === 'main' ? '#1a202c' : '#1c2a25')
        : (currentTimerType === 'main' ? '#e6eeff' : '#e6fff0');
    document.body.style.backgroundColor = bgColor;

    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Initialize timer type buttons
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
        // Update background color for dark mode
        const bgColor = currentTimerType === 'main' ? '#1a202c' : '#1c2a25';
        document.body.style.backgroundColor = bgColor;
    }
    
    // Check and request notification permission on page load
    if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            // Only show the permission request if it hasn't been granted or denied before
            requestNotificationPermission();
        }
        notificationPermission = Notification.permission === "granted";
    }

    // Rest of the existing initialization code...
});

function applyCustomInterval(input) {
    const minutes = parseInt(input.value);
    if (minutes && minutes > 0 && minutes <= 120) {
        setTimerDuration(minutes);
        input.value = ''; // Clear input after applying
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
        saveTasks(); // Save when new task is added
    }
}

// Drag and drop handlers
function handleDragStart(e) {
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.todo-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    saveTasks(); // Save when task order changes
}

function handleDragOver(e) {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const todoList = document.getElementById('todo-list');
    const siblings = [...todoList.querySelectorAll('.todo-item:not(.dragging)')];
    
    // Remove drag-over class from all items
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
        // Add drag-over to last item if we're at the end
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

// Initialize drag and drop for existing tasks
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

// Allow adding todos with Enter key
document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todo-input');
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
});

// Add this function to handle dropdown functionality
function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-button');
        const content = dropdown.querySelector('.dropdown-content');
        const arrow = button.querySelector('i');
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close all other dropdowns first
            dropdowns.forEach(other => {
                if (other !== dropdown) {
                    other.querySelector('.dropdown-content').classList.remove('show');
                    other.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
                }
            });
            
            // Toggle current dropdown
            content.classList.toggle('show');
            arrow.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            const arrow = dropdown.querySelector('.dropdown-button i');
            content.classList.remove('show');
            arrow.style.transform = 'rotate(0)';
        });
    });
    
    // Handle custom interval inputs
    const customInputs = document.querySelectorAll('.custom-interval input');
    customInputs.forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation()); // Prevent dropdown from closing
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyCustomInterval(input);
                // Close the dropdown
                const dropdown = input.closest('.dropdown');
                dropdown.querySelector('.dropdown-content').classList.remove('show');
                dropdown.querySelector('.dropdown-button i').style.transform = 'rotate(0)';
            }
        });
    });
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    setupDropdowns();
    loadTasks(); // Load saved tasks when page loads
    
    const todoInput = document.getElementById('todo-input');
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    // ... rest of your existing DOMContentLoaded code ...
});

// Add these functions for local storage handling
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
        // Optionally notify user
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
        saveTasks();
    };
    
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    if (taskData.completed) {
        textSpan.classList.add('completed');
    }
    textSpan.textContent = sanitizeInput(taskData.text);
    
    // Add delete button
    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fas fa-times delete-task';
    deleteBtn.onclick = function() {
        li.remove();
        saveTasks(); // Update localStorage after deletion
    };
    
    li.appendChild(dragHandle);
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    
    // Add drag event listeners
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    
    todoList.appendChild(li);
}

// Sanitize user input before adding to DOM
function sanitizeInput(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add checks for localStorage limits
function checkStorageLimit() {
    const totalSize = new Blob([localStorage.getItem('todoTasks')]).size;
    const limit = 5 * 1024 * 1024; // 5MB
    return totalSize < limit;
} 
