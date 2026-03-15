// content.js — captures selected text on the page
// Runs on every page. Sends selection to background script which stores it scoped by tab ID.

function saveSelection() {
  const text = window.getSelection()?.toString().trim() || '';
  // Send to background script which will store it with the correct tab ID
  chrome.runtime.sendMessage({ 
    type: 'SAVE_SELECTION', 
    text: text 
  });
}

// Save on mouseup (user finishes a selection drag)
document.addEventListener('mouseup', saveSelection);

// Also save on keyup for keyboard selections (Shift+arrow, Ctrl+A etc.)
document.addEventListener('keyup', (e) => {
  if (e.shiftKey || e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    setTimeout(saveSelection, 10); // Small delay to ensure selection is updated
  }
});

// Also listen for selection changes directly (debounced)
document.addEventListener('selectionchange', () => {
  clearTimeout(window.selectionTimeout);
  window.selectionTimeout = setTimeout(saveSelection, 150);
});