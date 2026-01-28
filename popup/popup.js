/**
 * X Growth Extension - Popup UI Controller
 */

// Import storage helper
const storage = (() => {
  return {
    async get(keys) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            if (typeof keys === 'string') {
              resolve(result[keys]);
            } else {
              resolve(result);
            }
          }
        });
      });
    },
    async set(items) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }
  };
})();

// Utility functions
const utils = {
  /**
   * Get date string in YYYY-MM-DD format
   */
  getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get short day name
   */
  getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  },

  /**
   * Get array of dates for last N days
   */
  getLastNDays(n) {
    const dates = [];
    const today = new Date();

    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates;
  }
};

// Reply Stats Manager
const replyStats = {
  /**
   * Get reply count for a specific date
   */
  async getCount(dateString) {
    const key = `replyCount_${dateString}`;
    const count = await storage.get(key);
    return count || 0;
  },

  /**
   * Get stats for multiple dates
   */
  async getStats(dates) {
    const keys = dates.map(date => `replyCount_${utils.getDateString(date)}`);
    const result = await storage.get(keys);

    const stats = [];
    dates.forEach(date => {
      const dateString = utils.getDateString(date);
      const key = `replyCount_${dateString}`;
      stats.push({
        date: dateString,
        dayName: utils.getDayName(date),
        count: result[key] || 0
      });
    });

    return stats;
  },

  /**
   * Update the stats display
   */
  async updateDisplay() {
    const today = utils.getDateString(new Date());
    const last7Days = utils.getLastNDays(7);

    // Get today's count
    const todayCount = await this.getCount(today);
    document.getElementById('todayCount').textContent = todayCount;

    // Get weekly stats
    const weeklyStats = await this.getStats(last7Days);
    const weekTotal = weeklyStats.reduce((sum, stat) => sum + stat.count, 0);
    document.getElementById('weekCount').textContent = weekTotal;

    // Render chart
    this.renderChart(weeklyStats);
  },

  /**
   * Render the weekly chart
   */
  renderChart(stats) {
    const chartContainer = document.getElementById('weeklyChart');
    const labelsContainer = document.getElementById('chartLabels');

    // Find max value for scaling
    const maxCount = Math.max(...stats.map(s => s.count), 1);

    // Clear existing content
    chartContainer.innerHTML = '';
    labelsContainer.innerHTML = '';

    // Create bars and labels
    stats.forEach(stat => {
      // Create bar
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      const height = (stat.count / maxCount) * 100;
      bar.style.height = height > 0 ? `${height}%` : '4px';
      bar.setAttribute('data-count', stat.count);
      bar.title = `${stat.dayName}: ${stat.count} ${stat.count === 1 ? 'reply' : 'replies'}`;
      chartContainer.appendChild(bar);

      // Create label
      const label = document.createElement('div');
      label.className = 'chart-label';
      label.textContent = stat.dayName;
      labelsContainer.appendChild(label);
    });
  },

  /**
   * Reset all stats
   */
  async reset() {
    if (!confirm('Are you sure you want to reset all reply statistics?')) {
      return;
    }

    try {
      // Get all keys
      const allData = await storage.get(null);
      const replyCountKeys = Object.keys(allData).filter(key => key.startsWith('replyCount_'));

      // Remove all reply count keys
      if (replyCountKeys.length > 0) {
        await new Promise((resolve, reject) => {
          chrome.storage.local.remove(replyCountKeys, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }

      // Update display
      await this.updateDisplay();

      // Show success message
      alert('Reply statistics have been reset.');
    } catch (error) {
      console.error('Failed to reset stats:', error);
      alert('Failed to reset statistics. Please try again.');
    }
  }
};

// Keywords Manager
const keywordsManager = {
  keywords: [],

  /**
   * Load keywords from storage
   */
  async load() {
    const keywords = await storage.get('nicheKeywords');
    this.keywords = keywords || [];
    this.render();
  },

  /**
   * Save keywords to storage
   */
  async save() {
    await storage.set({ nicheKeywords: this.keywords });

    // Notify content script of keyword changes
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('x.com')) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'KEYWORDS_UPDATED',
          keywords: this.keywords
        });
      }
    } catch (error) {
      // Tab might not have content script injected yet
      console.log('Could not notify content script:', error);
    }
  },

  /**
   * Add a keyword
   */
  async add(keyword) {
    const trimmed = keyword.trim().toLowerCase();

    if (!trimmed) {
      return;
    }

    if (this.keywords.includes(trimmed)) {
      alert('This keyword already exists.');
      return;
    }

    if (this.keywords.length >= 20) {
      alert('Maximum 20 keywords allowed.');
      return;
    }

    this.keywords.push(trimmed);
    await this.save();
    this.render();
  },

  /**
   * Remove a keyword
   */
  async remove(keyword) {
    this.keywords = this.keywords.filter(k => k !== keyword);
    await this.save();
    this.render();
  },

  /**
   * Render keywords list
   */
  render() {
    const container = document.getElementById('keywordsList');

    if (this.keywords.length === 0) {
      container.innerHTML = '<div class="empty-state">No keywords added yet</div>';
      return;
    }

    container.innerHTML = '';

    this.keywords.forEach(keyword => {
      const tag = document.createElement('div');
      tag.className = 'keyword-tag';

      const text = document.createElement('span');
      text.textContent = keyword;
      tag.appendChild(text);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'keyword-remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove keyword';
      removeBtn.addEventListener('click', () => this.remove(keyword));
      tag.appendChild(removeBtn);

      container.appendChild(tag);
    });
  }
};

// Settings Manager
const settingsManager = {
  /**
   * Load settings from storage
   */
  async load() {
    const settings = await storage.get(['enableScoring', 'enableNicheFilter', 'enableQuickStats']);

    // Set defaults if not set
    document.getElementById('enableScoring').checked = settings.enableScoring !== false;
    document.getElementById('enableNicheFilter').checked = settings.enableNicheFilter !== false;
    document.getElementById('enableQuickStats').checked = settings.enableQuickStats !== false;
  },

  /**
   * Save a setting
   */
  async save(key, value) {
    await storage.set({ [key]: value });

    // Notify content script
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('x.com')) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          settings: { [key]: value }
        });
      }
    } catch (error) {
      console.log('Could not notify content script:', error);
    }
  }
};

// Initialize popup
async function init() {
  try {
    // Load all data
    await Promise.all([
      replyStats.updateDisplay(),
      keywordsManager.load(),
      settingsManager.load()
    ]);

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
  }
}

function setupEventListeners() {
  // Keyword input
  const keywordInput = document.getElementById('keywordInput');
  const addKeywordBtn = document.getElementById('addKeywordBtn');

  addKeywordBtn.addEventListener('click', async () => {
    const keyword = keywordInput.value;
    await keywordsManager.add(keyword);
    keywordInput.value = '';
    keywordInput.focus();
  });

  keywordInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      const keyword = keywordInput.value;
      await keywordsManager.add(keyword);
      keywordInput.value = '';
    }
  });

  // Settings checkboxes
  document.getElementById('enableScoring').addEventListener('change', (e) => {
    settingsManager.save('enableScoring', e.target.checked);
  });

  document.getElementById('enableNicheFilter').addEventListener('change', (e) => {
    settingsManager.save('enableNicheFilter', e.target.checked);
  });

  document.getElementById('enableQuickStats').addEventListener('change', (e) => {
    settingsManager.save('enableQuickStats', e.target.checked);
  });

  // Reset stats button
  document.getElementById('resetStatsBtn').addEventListener('click', () => {
    replyStats.reset();
  });
}

// Start the popup
document.addEventListener('DOMContentLoaded', init);
