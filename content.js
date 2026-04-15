(function() {
  let quickNoteButton = null;

  function createQuickNoteButton() {
    const button = document.createElement('div');
    button.innerHTML = `
      <style>
        .quicknote-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          background: #27ae60;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          z-index: 999999;
          transition: transform 0.2s, background 0.2s;
        }
        .quicknote-fab:hover {
          transform: scale(1.1);
          background: #219a52;
        }
        .quicknote-fab:active {
          transform: scale(0.95);
        }
      </style>
      <span>📝</span>
    `;
    button.className = 'quicknote-fab';
    button.title = 'Quick Note (Saved to QuickNotes)';
    return button;
  }

  function init() {
    quickNoteButton = createQuickNoteButton();
    document.body.appendChild(quickNoteButton);

    quickNoteButton.addEventListener('click', async () => {
      const noteContent = prompt('Add a quick note for this page:\n\nPage: ' + document.title);
      
      if (noteContent && noteContent.trim()) {
        try {
          const result = await chrome.storage.local.get(['notes']);
          const notes = result.notes || [];
          
          const newNote = {
            id: Date.now().toString(),
            title: document.title.substring(0, 50),
            content: noteContent.trim() + '\n\n[From: ' + window.location.href + ']',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          notes.unshift(newNote);
          await chrome.storage.local.set({ notes });
          
          alert('Note saved to QuickNotes!');
        } catch (error) {
          console.error('Error saving quick note:', error);
        }
      }
    });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
