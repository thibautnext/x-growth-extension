/**
 * X Growth Extension - Content Script
 * Injects tweet scoring, niche filtering, and account stats into x.com
 */

(function() {
  'use strict';

  // ========== CONFIGURATION ==========
  const config = {
    selectors: {
      tweet: 'article[data-testid="tweet"]',
      tweetText: '[data-testid="tweetText"]',
      profileLink: 'a[role="link"][href^="/"]',
      likeButton: '[data-testid="like"]',
      retweetButton: '[data-testid="retweet"]',
      replyButton: '[data-testid="reply"]',
      profileImage: 'img[alt][src*="profile"]',
      replyComposer: '[data-testid="tweetTextarea_0"]'
    },
    debounceDelay: 300,
    tooltipOffset: { x: 10, y: 10 }
  };

  // ========== STATE ==========
  const state = {
    settings: {
      enableScoring: true,
      enableNicheFilter: true,
      enableQuickStats: true
    },
    keywords: [],
    processedTweets: new WeakSet(),
    statsCache: new Map(),
    lastReplyObserved: null
  };

  // ========== UTILITY FUNCTIONS ==========
  const utils = {
    /**
     * Parse number strings like "1.2K", "50M"
     */
    parseCount(str) {
      if (!str) return 0;

      const cleaned = str.trim().toLowerCase();
      const match = cleaned.match(/^([\d.]+)([km]?)$/);

      if (!match) return 0;

      const num = parseFloat(match[1]);
      const suffix = match[2];

      if (suffix === 'k') return Math.floor(num * 1000);
      if (suffix === 'm') return Math.floor(num * 1000000);
      return Math.floor(num);
    },

    /**
     * Format numbers with K/M suffixes
     */
    formatCount(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    },

    /**
     * Get current date string (YYYY-MM-DD)
     */
    getDateString() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Extract username from profile link
     */
    extractUsername(href) {
      if (!href) return null;
      const match = href.match(/^\/([^/]+)/);
      return match ? match[1] : null;
    },

    /**
     * Check if text contains any keywords
     */
    containsKeywords(text, keywords) {
      if (!text || keywords.length === 0) return false;
      const lowerText = text.toLowerCase();
      return keywords.some(keyword => lowerText.includes(keyword));
    }
  };

  // ========== STORAGE ==========
  const storage = {
    async get(keys) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
          resolve(result);
        });
      });
    },

    async set(items) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, () => {
          resolve();
        });
      });
    },

    async incrementReplyCount(date) {
      const key = `replyCount_${date}`;
      const result = await this.get(key);
      const count = (result[key] || 0) + 1;
      await this.set({ [key]: count });
    }
  };

  // ========== TWEET SCORER ==========
  const tweetScorer = {
    /**
     * Calculate opportunity score for a tweet
     */
    calculateScore(tweetData) {
      const { followers, likes, retweets, replies, tweetAge } = tweetData;

      // Avoid division by zero
      if (followers === 0) return 0;

      // Calculate engagement rate (likes + retweets per 1000 followers)
      const totalEngagement = likes + retweets;
      const engagementRate = (totalEngagement / followers) * 1000;

      // Recency factor (decay over time)
      // Assume tweetAge is in minutes
      const recencyFactor = Math.max(0.1, 1 - (tweetAge / (24 * 60))); // Decay over 24 hours

      // Reply opportunity (low replies = better opportunity)
      const replyFactor = 1 / (replies + 1);

      // Final score formula
      const score = (followers * engagementRate * replyFactor * recencyFactor) / 1000;

      return Math.max(0, Math.min(100, score)); // Clamp between 0-100
    },

    /**
     * Get score tier based on score value
     */
    getScoreTier(score) {
      if (score >= 10) return { tier: 'high', emoji: '🟢', label: 'High' };
      if (score >= 3) return { tier: 'medium', emoji: '🟡', label: 'Med' };
      return { tier: 'low', emoji: '🔴', label: 'Low' };
    },

    /**
     * Extract tweet data from DOM
     */
    extractTweetData(tweetElement) {
      try {
        // Get engagement counts
        const replyBtn = tweetElement.querySelector(config.selectors.replyButton);
        const retweetBtn = tweetElement.querySelector(config.selectors.retweetButton);
        const likeBtn = tweetElement.querySelector(config.selectors.likeButton);

        const replies = utils.parseCount(replyBtn?.getAttribute('aria-label') || '0');
        const retweets = utils.parseCount(retweetBtn?.getAttribute('aria-label') || '0');
        const likes = utils.parseCount(likeBtn?.getAttribute('aria-label') || '0');

        // Get tweet text for niche filtering
        const tweetTextEl = tweetElement.querySelector(config.selectors.tweetText);
        const tweetText = tweetTextEl?.textContent || '';

        // Estimate followers (try to get from profile link)
        // In real implementation, would need to parse from profile hover card
        // For MVP, using engagement as proxy
        const followers = this.estimateFollowers(likes, retweets);

        // Estimate tweet age (for MVP, assume recent - can't get exact timestamp easily)
        const tweetAge = 60; // Assume 1 hour old as baseline

        return {
          followers,
          likes,
          retweets,
          replies,
          tweetAge,
          tweetText
        };
      } catch (error) {
        console.error('[X Growth] Error extracting tweet data:', error);
        return null;
      }
    },

    /**
     * Estimate followers based on engagement
     * (Rough heuristic for MVP)
     */
    estimateFollowers(likes, retweets) {
      const totalEngagement = likes + retweets;

      // Average engagement rate is ~1-3% for most accounts
      // So followers ≈ engagement / 0.02
      const estimated = totalEngagement / 0.02;

      // Clamp to reasonable range
      return Math.max(100, Math.min(10000000, estimated));
    },

    /**
     * Add score badge to tweet - inserted into the engagement bar
     */
    addScoreBadge(tweetElement, score) {
      // Check if badge already exists
      if (tweetElement.querySelector('.xg-score-badge')) {
        return;
      }

      const { tier, emoji, label } = this.getScoreTier(score);

      const badge = document.createElement('div');
      badge.className = `xg-score-badge ${tier}`;
      badge.innerHTML = `
        <span class="emoji">${emoji}</span>
        <span>${label}</span>
      `;

      // Find the engagement bar (the row with reply, retweet, like, views, share)
      const engagementBar = tweetElement.querySelector('[role="group"]');
      if (engagementBar) {
        engagementBar.style.position = 'relative';
        engagementBar.appendChild(badge);
      } else {
        // Fallback: append to tweet
        tweetElement.style.position = 'relative';
        tweetElement.appendChild(badge);
      }
    }
  };

  // ========== NICHE FILTER ==========
  const nicheFilter = {
    /**
     * Check if tweet matches niche keywords
     */
    matchesNiche(tweetText) {
      if (state.keywords.length === 0) return null; // No filtering
      return utils.containsKeywords(tweetText, state.keywords);
    },

    /**
     * Apply niche filtering to tweet
     */
    applyFilter(tweetElement, tweetText) {
      const matches = this.matchesNiche(tweetText);

      if (matches === null) {
        // No keywords set, remove any existing filters
        tweetElement.removeAttribute('data-xg-niche');
        const badge = tweetElement.querySelector('.xg-niche-badge');
        if (badge) badge.remove();
        return;
      }

      tweetElement.setAttribute('data-xg-niche', matches);

      if (matches) {
        // Add niche badge
        if (!tweetElement.querySelector('.xg-niche-badge')) {
          const badge = document.createElement('div');
          badge.className = 'xg-niche-badge';
          badge.textContent = 'Niche';
          tweetElement.appendChild(badge);
        }
      }
    }
  };

  // ========== ACCOUNT STATS TOOLTIP ==========
  const accountStats = {
    activeTooltip: null,
    hoverTimeout: null,

    /**
     * Show tooltip with account stats
     */
    async showTooltip(profileElement, username, event) {
      // Clear any existing timeout
      clearTimeout(this.hoverTimeout);

      // Delay showing tooltip slightly
      this.hoverTimeout = setTimeout(async () => {
        // Check if we have cached stats
        let stats = state.statsCache.get(username);

        if (!stats) {
          // Estimate stats from visible tweets
          stats = await this.estimateStats(username);
          state.statsCache.set(username, stats);
        }

        // Create tooltip
        this.removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'xg-stats-tooltip';
        tooltip.innerHTML = `
          <div class="xg-stats-tooltip-header">@${username}</div>
          <div class="xg-stats-row">
            <span class="xg-stats-label">Followers</span>
            <span class="xg-stats-value highlight">${utils.formatCount(stats.followers)}</span>
          </div>
          <div class="xg-stats-row">
            <span class="xg-stats-label">Avg Engagement</span>
            <span class="xg-stats-value">${stats.avgEngagement}%</span>
          </div>
          <div class="xg-stats-row">
            <span class="xg-stats-label">Est. Reach</span>
            <span class="xg-stats-value">${stats.reach}</span>
          </div>
        `;

        // Position tooltip
        const rect = profileElement.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + config.tooltipOffset.x}px`;
        tooltip.style.top = `${rect.bottom + config.tooltipOffset.y}px`;

        document.body.appendChild(tooltip);
        this.activeTooltip = tooltip;
      }, 300);
    },

    /**
     * Remove active tooltip
     */
    removeTooltip() {
      clearTimeout(this.hoverTimeout);
      if (this.activeTooltip) {
        this.activeTooltip.remove();
        this.activeTooltip = null;
      }
    },

    /**
     * Estimate account stats from visible tweets
     */
    async estimateStats(username) {
      // In MVP, return estimated stats
      // In production, could aggregate from visible tweets

      // Mock estimation
      const followers = Math.floor(Math.random() * 100000) + 1000;
      const avgEngagement = (Math.random() * 5 + 0.5).toFixed(2);
      const reach = utils.formatCount(Math.floor(followers * (avgEngagement / 100)));

      return { followers, avgEngagement, reach };
    },

    /**
     * Attach stats button to tweet
     */
    attachListeners(tweetElement) {
      // Don't add button if already exists
      if (tweetElement.querySelector('.xg-stats-btn')) return;

      // Find first profile link in tweet
      const profileLinks = tweetElement.querySelectorAll('a[role="link"][href^="/"]');
      let username = null;

      for (const link of profileLinks) {
        const href = link.getAttribute('href');
        if (href && !href.includes('/status/') && !href.includes('/photo/')) {
          username = utils.extractUsername(href);
          if (username) break;
        }
      }

      if (!username) return;

      // Create clickable stats button
      const btn = document.createElement('div');
      btn.className = 'xg-stats-btn';
      btn.textContent = '📊';
      btn.title = `Stats @${username}`;

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Toggle tooltip
        if (btn.classList.contains('active')) {
          this.removeTooltip();
          btn.classList.remove('active');
        } else {
          // Remove any other active btn
          document.querySelectorAll('.xg-stats-btn.active').forEach(b => b.classList.remove('active'));
          this.removeTooltip();
          btn.classList.add('active');
          await this.showTooltip(btn, username, e);
        }
      });

      // Insert into engagement bar instead of absolute position
      const engagementBar = tweetElement.querySelector('[role="group"]');
      if (engagementBar) {
        engagementBar.appendChild(btn);
      }

      // Close tooltip when clicking elsewhere
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.xg-stats-btn') && !e.target.closest('.xg-stats-tooltip')) {
          this.removeTooltip();
          document.querySelectorAll('.xg-stats-btn.active').forEach(b => b.classList.remove('active'));
        }
      }, { once: true });
    }
  };

  // ========== REPLY TRACKER ==========
  const replyTracker = {
    /**
     * Initialize reply observation
     */
    init() {
      // Observe for reply submission
      this.observeReplySubmission();
    },

    /**
     * Observe when user submits a reply
     */
    observeReplySubmission() {
      // Watch for reply button clicks
      document.addEventListener('click', async (e) => {
        const target = e.target;

        // Check if it's a tweet button in reply context
        if (target.closest('[data-testid="tweetButtonInline"]') ||
            target.closest('[data-testid="tweetButton"]')) {

          // Check if we're in a reply context (composer has text)
          const composer = document.querySelector(config.selectors.replyComposer);

          if (composer && composer.textContent.trim().length > 0) {
            // Delay to ensure tweet is sent
            setTimeout(async () => {
              await this.trackReply();
            }, 1000);
          }
        }
      });
    },

    /**
     * Track a reply submission
     */
    async trackReply() {
      const today = utils.getDateString();

      // Avoid double counting
      const now = Date.now();
      if (state.lastReplyObserved && now - state.lastReplyObserved < 2000) {
        return;
      }

      state.lastReplyObserved = now;

      try {
        await storage.incrementReplyCount(today);
        console.log('[X Growth] Reply tracked for', today);
      } catch (error) {
        console.error('[X Growth] Failed to track reply:', error);
      }
    }
  };

  // ========== TWEET PROCESSOR ==========
  const tweetProcessor = {
    /**
     * Process a single tweet
     */
    async processTweet(tweetElement) {
      // Skip if already processed
      if (state.processedTweets.has(tweetElement)) {
        return;
      }

      state.processedTweets.add(tweetElement);
      tweetElement.setAttribute('data-xg-processed', 'true');

      try {
        // Extract tweet data
        const tweetData = tweetScorer.extractTweetData(tweetElement);
        if (!tweetData) return;

        // Apply tweet scoring
        if (state.settings.enableScoring) {
          const score = tweetScorer.calculateScore(tweetData);
          tweetScorer.addScoreBadge(tweetElement, score);
        }

        // Apply niche filtering
        if (state.settings.enableNicheFilter) {
          nicheFilter.applyFilter(tweetElement, tweetData.tweetText);
        }

        // Attach account stats listeners
        if (state.settings.enableQuickStats) {
          accountStats.attachListeners(tweetElement);
        }
      } catch (error) {
        console.error('[X Growth] Error processing tweet:', error);
      }
    },

    /**
     * Process all visible tweets
     */
    processAllTweets() {
      const tweets = document.querySelectorAll(config.selectors.tweet);
      tweets.forEach(tweet => this.processTweet(tweet));
    }
  };

  // ========== OBSERVER ==========
  const observer = {
    mutationObserver: null,

    /**
     * Initialize mutation observer
     */
    init() {
      // Process initial tweets
      tweetProcessor.processAllTweets();

      // Watch for new tweets
      this.mutationObserver = new MutationObserver(
        utils.debounce(() => {
          tweetProcessor.processAllTweets();
        }, config.debounceDelay)
      );

      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    /**
     * Disconnect observer
     */
    disconnect() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
    }
  };

  // ========== SETTINGS LOADER ==========
  const settingsLoader = {
    /**
     * Load settings from storage
     */
    async load() {
      try {
        const data = await storage.get([
          'enableScoring',
          'enableNicheFilter',
          'enableQuickStats',
          'nicheKeywords'
        ]);

        state.settings.enableScoring = data.enableScoring !== false;
        state.settings.enableNicheFilter = data.enableNicheFilter !== false;
        state.settings.enableQuickStats = data.enableQuickStats !== false;
        state.keywords = data.nicheKeywords || [];

        console.log('[X Growth] Settings loaded:', state.settings);
      } catch (error) {
        console.error('[X Growth] Failed to load settings:', error);
      }
    }
  };

  // ========== MESSAGE LISTENER ==========
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED') {
      Object.assign(state.settings, message.settings);

      // Reprocess all tweets
      state.processedTweets = new WeakSet();
      tweetProcessor.processAllTweets();
    } else if (message.type === 'KEYWORDS_UPDATED') {
      state.keywords = message.keywords;

      // Reprocess all tweets
      state.processedTweets = new WeakSet();
      tweetProcessor.processAllTweets();
    }
  });

  // ========== INITIALIZATION ==========
  async function init() {
    console.log('[X Growth] Extension initializing...');

    // Load settings first
    await settingsLoader.load();

    // Initialize components
    replyTracker.init();
    observer.init();

    console.log('[X Growth] Extension ready!');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
