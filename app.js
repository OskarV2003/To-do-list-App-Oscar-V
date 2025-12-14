// Clase Tarea para estructurar los datos (opcional, pero buena práctica OOP)
class Task {
    constructor(name, description, type) {
        this.id = Date.now().toString(); // ID único basado en timestamp
        this.name = name;
        this.description = description;
        this.type = type;
        this.completed = false;
        this.createdAt = new Date().toISOString();
    }
}

// Variables Globales
let tasks = [];
let currentFilter = 'all'; // all, pending, completed

// Referencias al DOM
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const totalTasksElem = document.getElementById('total-tasks');
const pendingTasksElem = document.getElementById('pending-tasks');
const completedTasksElem = document.getElementById('completed-tasks');

// Referencias del Modal
const modal = document.getElementById('task-modal');
const closeModalBtn = document.querySelector('.close-modal');
const modalTitle = document.getElementById('modal-title');
const modalStatus = document.getElementById('modal-status');
const modalType = document.getElementById('modal-type');
const modalDesc = document.getElementById('modal-desc');
const modalToggleBtn = document.getElementById('modal-toggle-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');
let currentModalTaskId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderTasks();
    updateSummary();
    setupEventListeners();
});

// Configurar Event Listeners
function setupEventListeners() {
    // Agregar Tarea
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    // Filtros
    document.getElementById('filter-all').addEventListener('click', () => setFilter('all'));
    document.getElementById('filter-pending').addEventListener('click', () => setFilter('pending'));
    document.getElementById('filter-completed').addEventListener('click', () => setFilter('completed'));

    // Cerrar Modal
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Acciones del Modal
    modalToggleBtn.addEventListener('click', () => {
        if (currentModalTaskId) {
            toggleTaskStatus(currentModalTaskId);
            closeModal();
        }
    });

    modalDeleteBtn.addEventListener('click', () => {
        if (currentModalTaskId) {
            deleteTask(currentModalTaskId);
            closeModal();
        }
    });
}

// --- Lógica de Negocio ---

function addTask() {
    const nameInput = document.getElementById('task-name');
    const descInput = document.getElementById('task-desc');
    const typeInput = document.getElementById('task-type');

    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const type = typeInput.value;

    if (name && description) {
        const newTask = new Task(name, description, type);
        tasks.push(newTask); // Agregamos al inicio para que salga primero
        saveTasks();
        
        // Reset form
        taskForm.reset();
        
        // Render y Update
        renderTasks();
        updateSummary();
    }
}

function deleteTask(id) {
    if(confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateSummary();
    }
}

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateSummary();
    }
}

// --- Persistencia (LocalStorage) ---

function saveTasks() {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const storedTasks = localStorage.getItem('myTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// --- Renderizado UI ---

function renderTasks() {
    tasksList.innerHTML = '';

    // Filtrar tareas
    let filteredTasks = tasks;
    if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }

    // Ordenar: pendientes primero, luego completadas
    filteredTasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<li class="task-item" style="justify-content:center; color:#888;">No hay tareas en esta lista</li>';
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : 'pending'}`;
        
        li.innerHTML = `
            <div class="task-content" onclick="openTaskDetails('${task.id}')">
                <span class="task-title">${escapeHtml(task.name)}</span>
                <div class="task-meta">
                    <span class="badge">${task.type}</span> • ${task.completed ? 'Completada' : 'Pendiente'}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn" onclick="toggleTaskStatus('${task.id}')" title="${task.completed ? 'Marcar Pendiente' : 'Marcar Completada'}">
                    ${task.completed ? '↩' : '✓'}
                </button>
                <button class="action-btn delete" onclick="deleteTask('${task.id}')" title="Eliminar">
                    🗑
                </button>
            </div>
        `;
        tasksList.appendChild(li);
    });
}

function updateSummary() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    totalTasksElem.textContent = total;
    completedTasksElem.textContent = completed;
    pendingTasksElem.textContent = pending;
}

function setFilter(filterType) {
    currentFilter = filterType;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filterType}`).classList.add('active');

    renderTasks();
}

// --- Modal Logic ---

function openTaskDetails(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    currentModalTaskId = id;
    
    // Llenar datos
    modalTitle.textContent = task.name;
    modalDesc.textContent = task.description;
    modalType.textContent = task.type;
    
    // Estado y Estilos
    modalStatus.textContent = task.completed ? 'Completada' : 'Pendiente';
    modalStatus.style.background = task.completed ? '#d1fae5' : '#fef3c7';
    modalStatus.style.color = task.completed ? '#065f46' : '#92400e';

    // Botón de acción dinámico
    modalToggleBtn.textContent = task.completed ? 'Marcar como Pendiente' : 'Marcar como Completada';

    // Mostrar
    modal.classList.remove('hidden');
    // Pequeño delay para la animación CSS
    setTimeout(() => modal.classList.add('visible'), 10);
}

// Necesitamos exponer estas funciones al scope global para que los onclick del HTML funcionen
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.openTaskDetails = openTaskDetails;

function closeModal() {
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.classList.add('hidden');
        currentModalTaskId = null;
    }, 300); // Esperar a que termine la transición
}

// Helper para seguridad XSS simple
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
