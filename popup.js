document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'blockedSites';
  const THEME_KEY = 'theme';
  const DEFAULT_ADS = [
    'doubleclick.net', 'googlesyndication.com', 'adservice.google.com',
    'taboola.com', 'outbrain.com', 'crwdcntrl.net', 'quantserve.com'
  ];

  // Elements
  const siteInput = document.getElementById('siteInput');
  const addBtn = document.getElementById('addBtn');
  const blockList = document.getElementById('blockList');
  const emptyState = document.getElementById('emptyState');
  const searchInput = document.getElementById('searchInput');
  const themeToggle = document.getElementById('themeToggle').querySelector('span');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');

  // Theme
  const applyTheme = () => {
    chrome.storage.sync.get({ [THEME_KEY]: 'auto' }, data => {
      const mode = data[THEME_KEY];
      const isDark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.body.classList.toggle('dark', isDark);
      themeToggle.textContent = isDark ? 'light mode' : 'dark mode';
    });
  };

  document.getElementById('themeToggle').addEventListener('click', () => {
    chrome.storage.sync.get({ [THEME_KEY]: 'auto' }, data => {
      const modes = ['light', 'dark', 'auto'];
      const next = modes[(modes.indexOf(data[THEME_KEY]) + 1) % 3];
      chrome.storage.sync.set({ [THEME_KEY]: next }, applyTheme);
    });
  });

  // List rendering
  const renderList = (sites, filter = '') => {
    const filtered = filter ? sites.filter(s => s.includes(filter.toLowerCase())) : sites;
    blockList.innerHTML = '';
    emptyState.style.display = filtered.length === 0 ? 'block' : 'none';

    filtered.forEach(site => {
      const li = document.createElement('li');
      li.className = 'mdc-list-item';
      li.innerHTML = `
        <span class="mdc-list-item__text">${site}</span>
        <span class="material-icons mdc-list-item__meta" data-site="${site}">delete</span>
      `;
      blockList.appendChild(li);
    });

    document.querySelectorAll('.mdc-list-item__meta').forEach(btn => {
      btn.addEventListener('click', () => removeSite(btn.dataset.site));
    });
  };

  const loadSites = (filter = '') => {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
      let sites = data[STORAGE_KEY];
      if (sites.length === 0) {
        sites = [...DEFAULT_ADS];
        chrome.storage.sync.set({ [STORAGE_KEY]: sites });
      }
      renderList(sites, filter);
    });
  };

  // Actions
  const addSite = () => {
    const site = siteInput.value.trim().toLowerCase();
    if (!site) return;
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
      if (!data[STORAGE_KEY].includes(site)) {
        const updated = [...data[STORAGE_KEY], site];
        chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
          siteInput.value = '';
          loadSites();
        });
      }
    });
  };

  const removeSite = (site) => {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
      const updated = data[STORAGE_KEY].filter(s => s !== site);
      chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => loadSites());
    });
  };

  // Export
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ [STORAGE_KEY]: [] }, data => {
      const blob = new Blob([JSON.stringify(data[STORAGE_KEY], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'blocked-sites.json'; a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Import
  importInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const sites = JSON.parse(ev.target.result);
        if (Array.isArray(sites)) {
          chrome.storage.sync.set({ [STORAGE_KEY]: sites }, () => {
            loadSites();
            alert('List imported!');
          });
        }
      } catch { alert('Invalid file'); }
    };
    reader.readAsText(file);
  });

  // Events
  addBtn.addEventListener('click', addSite);
  siteInput.addEventListener('keypress', e => e.key === 'Enter' && addSite());
  searchInput.addEventListener('input', e => loadSites(e.target.value));

  // Init
  applyTheme();
  loadSites();

  // Listen to system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
});