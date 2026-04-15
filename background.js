chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ notes: [] });
    console.log('QuickNotes extension installed');
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('QuickNotes extension started');
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['notes'], (result) => {
    console.log('Current notes count:', result.notes?.length || 0);
  });
});
