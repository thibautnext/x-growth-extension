/**
 * Chrome Storage API helpers for X Growth Extension
 * Provides simple async/await interface for storage operations
 */

const StorageHelper = {
  /**
   * Get value(s) from Chrome Storage
   * @param {string|string[]|null} keys - Key(s) to retrieve, null for all
   * @returns {Promise<any>} Retrieved value(s)
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          // If single key requested, return just that value
          if (typeof keys === 'string') {
            resolve(result[keys]);
          } else {
            resolve(result);
          }
        }
      });
    });
  },

  /**
   * Set value(s) in Chrome Storage
   * @param {object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
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
  },

  /**
   * Remove key(s) from Chrome Storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Clear all data from Chrome Storage
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Get niche keywords array
   * @returns {Promise<string[]>}
   */
  async getNicheKeywords() {
    const keywords = await this.get('nicheKeywords');
    return keywords || [];
  },

  /**
   * Set niche keywords array
   * @param {string[]} keywords
   * @returns {Promise<void>}
   */
  async setNicheKeywords(keywords) {
    return this.set({ nicheKeywords: keywords });
  },

  /**
   * Get reply stats for a specific date (YYYY-MM-DD)
   * @param {string} date
   * @returns {Promise<number>}
   */
  async getReplyCount(date) {
    const key = `replyCount_${date}`;
    const count = await this.get(key);
    return count || 0;
  },

  /**
   * Increment reply count for a specific date
   * @param {string} date
   * @returns {Promise<void>}
   */
  async incrementReplyCount(date) {
    const key = `replyCount_${date}`;
    const count = await this.getReplyCount(date);
    return this.set({ [key]: count + 1 });
  },

  /**
   * Get reply stats for multiple dates
   * @param {string[]} dates - Array of date strings (YYYY-MM-DD)
   * @returns {Promise<object>} Object with date keys and count values
   */
  async getReplyStats(dates) {
    const keys = dates.map(date => `replyCount_${date}`);
    const result = await this.get(keys);

    const stats = {};
    dates.forEach(date => {
      const key = `replyCount_${date}`;
      stats[date] = result[key] || 0;
    });

    return stats;
  },

  /**
   * Get total reply count for a date range
   * @param {string[]} dates - Array of date strings
   * @returns {Promise<number>}
   */
  async getTotalReplies(dates) {
    const stats = await this.getReplyStats(dates);
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}
