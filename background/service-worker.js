/**
 * X Growth Extension - Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// ========== INITIALIZATION ==========
console.log('[X Growth] Service worker started');

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[X Growth] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default settings
    await chrome.storage.local.set({
      enableScoring: true,
      enableNicheFilter: true,
      enableQuickStats: true,
      nicheKeywords: []
    });

    console.log('[X Growth] Default settings initialized');

    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'https://x.com' });
  } else if (details.reason === 'update') {
    console.log('[X Growth] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// ========== MESSAGE HANDLERS ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[X Growth] Received message:', message.type);

  switch (message.type) {
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true; // Indicates async response

    case 'PING':
      sendResponse({ status: 'ok' });
      return false;

    default:
      console.warn('[X Growth] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

/**
 * Handle get settings request
 */
async function handleGetSettings(sendResponse) {
  try {
    const settings = await chrome.storage.local.get([
      'enableScoring',
      'enableNicheFilter',
      'enableQuickStats',
      'nicheKeywords'
    ]);

    sendResponse({ success: true, settings });
  } catch (error) {
    console.error('[X Growth] Failed to get settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ========== KEEP ALIVE ==========
// Keep service worker alive for better responsiveness
chrome.runtime.onConnect.addListener((port) => {
  console.log('[X Growth] Port connected:', port.name);

  port.onDisconnect.addListener(() => {
    console.log('[X Growth] Port disconnected:', port.name);
  });
});

// ========== STORAGE LISTENER ==========
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  console.log('[X Growth] Storage changed:', Object.keys(changes));

  // Broadcast settings changes to all X.com tabs
  if (changes.enableScoring || changes.enableNicheFilter || changes.enableQuickStats) {
    broadcastSettingsUpdate(changes);
  }

  if (changes.nicheKeywords) {
    broadcastKeywordsUpdate(changes.nicheKeywords.newValue);
  }
});

/**
 * Broadcast settings update to all X.com tabs
 */
async function broadcastSettingsUpdate(changes) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://x.com/*' });

    const settings = {};
    if (changes.enableScoring) settings.enableScoring = changes.enableScoring.newValue;
    if (changes.enableNicheFilter) settings.enableNicheFilter = changes.enableNicheFilter.newValue;
    if (changes.enableQuickStats) settings.enableQuickStats = changes.enableQuickStats.newValue;

    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SETTINGS_UPDATED',
        settings
      }).catch(() => {
        // Tab might not have content script loaded yet
      });
    });
  } catch (error) {
    console.error('[X Growth] Failed to broadcast settings update:', error);
  }
}

/**
 * Broadcast keywords update to all X.com tabs
 */
async function broadcastKeywordsUpdate(keywords) {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://x.com/*' });

    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'KEYWORDS_UPDATED',
        keywords
      }).catch(() => {
        // Tab might not have content script loaded yet
      });
    });
  } catch (error) {
    console.error('[X Growth] Failed to broadcast keywords update:', error);
  }
}

// ========== ACTION HANDLER ==========
chrome.action.onClicked.addListener((tab) => {
  console.log('[X Growth] Action clicked on tab:', tab.id);
  // Popup will open automatically due to manifest configuration
});

// ========== ERROR HANDLERS ==========
self.addEventListener('error', (event) => {
  console.error('[X Growth] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[X Growth] Unhandled promise rejection:', event.reason);
});

console.log('[X Growth] Service worker initialized successfully');
