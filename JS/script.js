document.addEventListener('DOMContentLoaded', () => {

    /* --- Navigation Functionality --- */
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // --- Global function to update homepage stats ---
    function updateHomepageStats() {
        // This function is now called from other pages to keep stats in sync
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const notes = JSON.parse(localStorage.getItem('notes')) || [];

        const totalTasks = tasks.length;
        const pendingTasks = tasks.filter(task => !task.completed).length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalNotes = notes.length;

        // Update the display on the homepage if the elements exist
        const totalTasksStat = document.getElementById('total-tasks-stat');
        if (totalTasksStat) {
            totalTasksStat.textContent = totalTasks;
        }
        const pendingTasksStat = document.getElementById('pending-tasks-stat');
        if (pendingTasksStat) {
            pendingTasksStat.textContent = pendingTasks;
        }
        const completedTasksStat = document.getElementById('completed-tasks-stat');
        if (completedTasksStat) {
            completedTasksStat.textContent = completedTasks;
        }
        const totalNotesStat = document.getElementById('total-notes-stat');
        if (totalNotesStat) {
            totalNotesStat.textContent = totalNotes;
        }
    }

   // Determine the current page to run specific functions
const currentPage = window.location.pathname.split('/').pop().replace('.html', '');

if (currentPage === 'homepage' || currentPage === '') {
    updateHomepageStats();
}
if (currentPage === 'tasks' || currentPage === 'tasks.html') {
    initializeTasksPage();
}
if (currentPage === 'notes' || currentPage === 'notes.html') {
    initializeNotesPage();
}

    /* --- To-Do List Functions (Only runs on tasks.html) --- */
    function initializeTasksPage() {
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');
        const filters = document.querySelector('.filters');
        const tasksRemainingSpan = document.getElementById('tasks-remaining');
        const clearCompletedBtn = document.getElementById('clear-completed-btn');

        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let currentFilter = 'all';

        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
            updateHomepageStats(); // Call global update function
        }

        function renderTasks() {
            taskList.innerHTML = '';
            const filteredTasks = tasks.filter(task => {
                if (currentFilter === 'all') return true;
                if (currentFilter === 'pending') return !task.completed;
                if (currentFilter === 'completed') return task.completed;
            });

            if (filteredTasks.length === 0 && tasks.length > 0 && currentFilter === 'completed') {
                const li = document.createElement('li');
                li.innerHTML = '<p style="text-align: center; color: #a9b1d6; padding: 1rem;">No completed tasks.</p>';
                taskList.appendChild(li);
            } else if (filteredTasks.length === 0 && tasks.length > 0 && currentFilter === 'pending') {
                const li = document.createElement('li');
                li.innerHTML = '<p style="text-align: center; color: #a9b1d6; padding: 1rem;">No pending tasks.</p>';
                taskList.appendChild(li);
            } else if (filteredTasks.length === 0 && tasks.length === 0) {
                const li = document.createElement('li');
                li.innerHTML = '<p style="text-align: center; color: #a9b1d6; padding: 1rem;">Your to-do list is empty. Add a task to get started!</p>';
                taskList.appendChild(li);
            }

            filteredTasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    <button class="delete-btn">&times;</button>
                `;
                li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(index));
                li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(index));
                taskList.appendChild(li);
            });
            updateStats();
        }

        function addTask() {
            const text = taskInput.value.trim();
            if (text) {
                tasks.push({ text, completed: false });
                taskInput.value = '';
                saveTasks();
                renderTasks();
            }
        }

        function toggleTask(index) {
            tasks[index].completed = !tasks[index].completed;
            saveTasks();
            renderTasks();
        }

        function deleteTask(index) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }

        function updateStats() {
            const remaining = tasks.filter(task => !task.completed).length;
            tasksRemainingSpan.textContent = `${remaining} tasks remaining`;
        }

        function clearCompleted() {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
        }

        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });

        filters.addEventListener('click', (e) => {
            if (e.target.matches('.filter-btn')) {
                filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                renderTasks();
            }
        });

        clearCompletedBtn.addEventListener('click', clearCompleted);

        renderTasks();
        updateHomepageStats(); // Initial call to update homepage stats on page load
    }

    /* --- Notes Functions (Only runs on notes.html) --- */
    function initializeNotesPage() {
        const notesGrid = document.getElementById('notes-grid');
        const addNoteBtn = document.getElementById('add-note-btn');
        const noteModal = document.getElementById('note-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        const noteForm = document.getElementById('note-form');
        const noteIdInput = document.getElementById('note-id');
        const noteTitleInput = document.getElementById('note-title');
        const noteContentInput = document.getElementById('note-content');
        const cancelNoteBtn = document.getElementById('cancel-note-btn');
        const searchInput = document.getElementById('search-input');
        const emptyState = document.getElementById('empty-state');

        let notes = JSON.parse(localStorage.getItem('notes')) || [];

        function saveNotes() {
            localStorage.setItem('notes', JSON.stringify(notes));
            updateHomepageStats(); // Call global update function
        }

        function renderNotes(searchQuery = '') {
            notesGrid.innerHTML = '';
            const filteredNotes = notes.filter(note =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredNotes.length === 0) {
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
            }

            filteredNotes.forEach((note, index) => {
                const noteCard = document.createElement('div');
                noteCard.className = 'note-card';
                noteCard.innerHTML = `
                    <div class="note-header">
                        <h3 class="note-title">${note.title}</h3>
                        <div class="note-actions">
                            <button class="note-action-btn edit-btn" data-index="${index}">✏️</button>
                            <button class="note-action-btn delete-btn" data-index="${index}">🗑️</button>
                        </div>
                    </div>
                    <p class="note-content">${note.content}</p>
                    <span class="note-date">Created: ${new Date(note.date).toLocaleDateString()}</span>
                `;

                notesGrid.appendChild(noteCard);
            });
        }

        function openModal(note = null, index = null) {
            noteModal.style.display = 'block';
            if (note) {
                noteIdInput.value = index;
                noteTitleInput.value = note.title;
                noteContentInput.value = note.content;
            } else {
                noteIdInput.value = '';
                noteTitleInput.value = '';
                noteContentInput.value = '';
            }
        }

        function closeModal() {
            noteModal.style.display = 'none';
            noteForm.reset();
        }

        function addOrUpdateNote(event) {
            event.preventDefault();
            const title = noteTitleInput.value;
            const content = noteContentInput.value;
            const index = noteIdInput.value;

            if (index === '') {
                // Add new note
                notes.unshift({
                    id: Date.now(),
                    title,
                    content,
                    date: new Date().toISOString()
                });
            } else {
                // Update existing note
                notes[index].title = title;
                notes[index].content = content;
            }

            saveNotes();
            renderNotes();
            closeModal();
        }

        function deleteNote(index) {
            if (confirm('Are you sure you want to delete this note?')) {
                notes.splice(index, 1);
                saveNotes();
                renderNotes();
            }
        }

        addNoteBtn.addEventListener('click', () => openModal());
        closeModalBtn.addEventListener('click', closeModal);
        cancelNoteBtn.addEventListener('click', closeModal);
        noteForm.addEventListener('submit', addOrUpdateNote);
        
        notesGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const index = e.target.dataset.index;
                openModal(notes[index], index);
            } else if (e.target.classList.contains('delete-btn')) {
                const index = e.target.dataset.index;
                deleteNote(index);
            }
        });

        searchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value);
        });

        renderNotes();
        updateHomepageStats(); // Initial call to update homepage stats on page load
    }
});