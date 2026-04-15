class NotesManager {
  constructor() {
    this.notes = [];
    this.noteInput = document.getElementById('noteInput');
    this.noteTitle = document.getElementById('noteTitle');
    this.saveBtn = document.getElementById('saveBtn');
    this.notesList = document.getElementById('notesList');
    this.noteCount = document.getElementById('noteCount');
    this.emptyState = document.getElementById('emptyState');

    this.init();
  }

  async init() {
    await this.loadNotes();
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.saveBtn.addEventListener('click', () => this.saveNote());
    
    this.noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.saveNote();
      }
    });

    this.notesList.addEventListener('dblclick', (e) => {
      const noteCard = e.target.closest('.note-card');
      if (noteCard && !noteCard.classList.contains('editing')) {
        this.startEditing(noteCard);
      }
    });

    this.notesList.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit');
      const deleteBtn = e.target.closest('.btn-delete');
      const noteCard = e.target.closest('.note-card');

      if (editBtn) {
        this.startEditing(noteCard);
      } else if (deleteBtn) {
        this.deleteNote(noteCard.dataset.id);
      }
    });

    this.notesList.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const editingCard = this.notesList.querySelector('.note-card.editing');
        if (editingCard) {
          this.cancelEditing(editingCard.dataset.id);
        }
      }
    });
  }

  async loadNotes() {
    try {
      const result = await chrome.storage.local.get(['notes']);
      this.notes = result.notes || [];
    } catch (error) {
      console.error('Error loading notes:', error);
      this.notes = [];
    }
  }

  async saveNotes() {
    try {
      await chrome.storage.local.set({ notes: this.notes });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }

  async saveNote() {
    const content = this.noteInput.value.trim();
    const title = this.noteTitle.value.trim();

    if (!content) {
      this.noteInput.focus();
      return;
    }

    const note = {
      id: Date.now().toString(),
      title: title || this.generateTitle(content),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.unshift(note);
    await this.saveNotes();

    this.noteInput.value = '';
    this.noteTitle.value = '';
    this.noteInput.focus();
    this.render();
  }

  generateTitle(content) {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
  }

  startEditing(noteCard) {
    const noteId = noteCard.dataset.id;
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    noteCard.classList.add('editing');
    noteCard.innerHTML = `
      <div class="note-card-header">
        <input type="text" class="edit-title-input" value="${this.escapeHtml(note.title)}" maxlength="50">
        <span class="note-date">Editing...</span>
      </div>
      <textarea class="edit-textarea" rows="4">${this.escapeHtml(note.content)}</textarea>
      <div class="note-card-actions">
        <button class="btn-edit save-edit">Save</button>
        <button class="btn-delete cancel-edit">Cancel</button>
      </div>
    `;

    const textarea = noteCard.querySelector('.edit-textarea');
    const titleInput = noteCard.querySelector('.edit-title-input');
    
    textarea.focus();
    this.resizeTextarea(textarea);

    textarea.addEventListener('input', () => this.resizeTextarea(textarea));
    
    noteCard.querySelector('.save-edit').addEventListener('click', () => {
      this.saveEdit(noteId, titleInput.value, textarea.value);
    });
    
    noteCard.querySelector('.cancel-edit').addEventListener('click', () => {
      this.cancelEditing(noteId);
    });

    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        textarea.focus();
      }
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.cancelEditing(noteId);
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        this.saveEdit(noteId, titleInput.value, textarea.value);
      }
    });
  }

  resizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  async saveEdit(noteId, title, content) {
    const noteIndex = this.notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;

    if (!content.trim()) {
      return;
    }

    this.notes[noteIndex] = {
      ...this.notes[noteIndex],
      title: title.trim() || this.generateTitle(content),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };

    await this.saveNotes();
    this.render();
  }

  async cancelEditing(noteId) {
    this.render();
  }

  async deleteNote(noteId) {
    if (!confirm('Delete this note?')) return;

    this.notes = this.notes.filter(n => n.id !== noteId);
    await this.saveNotes();
    this.render();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    this.noteCount.textContent = `${this.notes.length} note${this.notes.length !== 1 ? 's' : ''}`;

    if (this.notes.length === 0) {
      this.notesList.innerHTML = '';
      this.notesList.appendChild(this.emptyState);
      return;
    }

    const notesHtml = this.notes.map(note => `
      <div class="note-card" data-id="${note.id}">
        <div class="note-card-header">
          <span class="note-title">${this.escapeHtml(note.title)}</span>
          <span class="note-date">${this.formatDate(note.createdAt)}</span>
        </div>
        <div class="note-content">${this.escapeHtml(note.content)}</div>
        <div class="note-card-actions">
          <button class="btn-edit">Edit</button>
          <button class="btn-delete">Delete</button>
        </div>
      </div>
    `).join('');

    this.notesList.innerHTML = notesHtml;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NotesManager();
});
