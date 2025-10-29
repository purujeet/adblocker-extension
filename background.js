const STORAGE_KEY = 'blockedSites';
const BLOCKED_PAGE = chrome.runtime.getURL('blocked.html');

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  const hostname = url.hostname.toLowerCase();

  chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
    const blocked = data[STORAGE_KEY].some(block => {
      return hostname === block || hostname.endsWith('.' + block);
    });

    if (blocked) {
      chrome.tabs.update(details.tabId, { url: BLOCKED_PAGE });
    }
  });
});