// ========================================
// TO-DO LIST APP - JAVASCRIPT
// ========================================

// ========================================
// STATE MANAGEMENT
// ========================================

let todos = [];
let currentFilter = 'all';
const STORAGE_KEY = 'todos_data';

// ========================================
// DOM ELEMENTS
// ========================================

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const remainingTasksSpan = document.getElementById('remainingTasks');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmBtn = document.getElementById('confirmBtn');
const toast = document.getElementById('toast');

// ========================================
// EVENT LISTENERS
// ========================================

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

clearCompletedBtn.addEventListener('click', () => {
    if (todos.some(todo => todo.completed)) {
        openConfirmModal('Are you sure you want to clear all completed tasks?', clearCompleted);
    } else {
        showToast('No completed tasks to clear', 'info');
    }
});

clearAllBtn.addEventListener('click', () => {
    if (todos.length > 0) {
        openConfirmModal('Are you sure you want to delete all tasks? This cannot be undone.', clearAllTodos);
    } else {
        showToast('No tasks to clear', 'info');
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        renderTodos();
    });
});

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * Initialize the app and load todos from localStorage
 */
function init() {
    loadTodosFromStorage();
    renderTodos();
}

/**
 * Add a new todo
 */
function addTodo() {
    const text = todoInput.value.trim();
    
    if (text === '') {
        showToast('Please enter a task', 'error');
        todoInput.focus();
        return;
    }

    if (text.length > 200) {
        showToast('Task is too long (max 200 characters)', 'error');
        return;
    }

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'medium'
    };

    todos.unshift(newTodo);
    saveTodosToStorage();
    renderTodos();
    todoInput.value = '';
    todoInput.focus();
    showToast('Task added successfully', 'success');
}

/**
 * Toggle todo completion status
 */
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodosToStorage();
        renderTodos();
        showToast(
            todo.completed ? 'Task completed!' : 'Task marked as incomplete',
            'success'
        );
    }
}

/**
 * Delete a todo
 */
function deleteTodo(id) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex !== -1) {
        const deletedTodo = todos[todoIndex];
        todos.splice(todoIndex, 1);
        saveTodosToStorage();
        renderTodos();
        showToast('Task deleted', 'success');
    }
}

/**
 * Clear all completed todos
 */
function clearCompleted() {
    const initialLength = todos.length;
    todos = todos.filter(todo => !todo.completed);
    const deletedCount = initialLength - todos.length;
    
    saveTodosToStorage();
    renderTodos();
    showToast(`${deletedCount} completed task(s) cleared`, 'success');
    closeModal();
}

/**
 * Clear all todos
 */
function clearAllTodos() {
    const count = todos.length;
    todos = [];
    saveTodosToStorage();
    renderTodos();
    showToast(`All ${count} tasks deleted`, 'success');
    closeModal();
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render todos based on current filter
 */
function renderTodos() {
    todoList.innerHTML = '';
    
    let filteredTodos = todos;
    
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
    }

    if (filteredTodos.length === 0) {
        emptyState.classList.remove('hidden');
        todoList.innerHTML = '';
    } else {
        emptyState.classList.add('hidden');
        filteredTodos.forEach(todo => {
            const li = createTodoElement(todo);
            todoList.appendChild(li);
        });
    }

    updateStats();
}

/**
 * Create a todo element
 */
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.innerHTML = `
        <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''}
            onchange="toggleTodo(${todo.id})"
        >
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <span class="priority-badge priority-${todo.priority}">
            ${todo.priority}
        </span>
        <div class="todo-actions">
            <button class="todo-btn delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return li;
}

/**
 * Update statistics
 */
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const remaining = total - completed;

    totalTasksSpan.textContent = total;
    completedTasksSpan.textContent = completed;
    remainingTasksSpan.textContent = remaining;
}

// ========================================
// STORAGE FUNCTIONS
// ========================================

/**
 * Save todos to localStorage
 */
function saveTodosToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos to localStorage:', error);
        showToast('Error saving tasks', 'error');
    }
}

/**
 * Load todos from localStorage
 */
function loadTodosFromStorage() {
    try {
        const storedTodos = localStorage.getItem(STORAGE_KEY);
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
        } else {
            todos = [];
        }
    } catch (error) {
        console.error('Error loading todos from localStorage:', error);
        todos = [];
        showToast('Error loading tasks', 'error');
    }
}

// ========================================
// MODAL FUNCTIONS
// ========================================

/**
 * Open confirmation modal
 */
function openConfirmModal(message, onConfirm) {
    confirmMessage.textContent = message;
    confirmModal.classList.add('show');
    
    confirmBtn.onclick = () => {
        onConfirm();
    };
}

/**
 * Close confirmation modal
 */
function closeModal() {
    confirmModal.classList.remove('show');
    confirmBtn.onclick = null;
}

// Close modal when clicking outside
confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeModal();
    }
});

// ========================================
// NOTIFICATION FUNCTIONS
// ========================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Show notification on page load
window.addEventListener('load', () => {
    if (todos.length === 0) {
        showToast('Welcome to your To-Do List App!', 'info');
    }
});