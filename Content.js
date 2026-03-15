// content.js — captures selected text on the page
// Runs on every page. Sends selection to background script which stores it scoped by tab ID.

function saveSelection() {
  // Check if chrome API is available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  const text = window.getSelection()?.toString().trim() || '';
  
  // Send to background script which will store it with the correct tab ID
  try {
    chrome.runtime.sendMessage({ 
      type: 'SAVE_SELECTION', 
      text: text 
    }, (response) => {
      // Handle potential errors silently
      if (chrome.runtime.lastError) {
        // Extension context might be invalidated, ignore
        return;
      }
    });
  } catch (error) {
    // Silently handle errors (extension might be reloading, etc.)
    return;
  }
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