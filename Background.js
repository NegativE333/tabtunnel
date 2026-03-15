// background.js — TabTunnel service worker

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle selection save from content script
  if (message.type === 'SAVE_SELECTION') {
    if (sender.tab?.id) {
      const storageKey = `selectedText_${sender.tab.id}`;
      chrome.storage.session.set({ [storageKey]: message.text || '' });
    }
    return false;
  }

  // Handle request for active tab data
  if (message.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.length) {
        sendResponse({ error: 'No active tab' });
        return;
      }
      const tab = tabs[0];

      // Read selected text from session storage scoped by tab ID
      const storageKey = `selectedText_${tab.id}`;
      chrome.storage.session.get(storageKey, (data) => {
        const selection = data[storageKey] || '';
        sendResponse({
          url:        tab.url,
          title:      tab.title,
          favIconUrl: tab.favIconUrl || null,
          selection:  selection,
        });
      });
    });
    return true; // keep channel open for async response
  }
});