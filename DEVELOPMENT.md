# Development Guide - X Growth Extension

Technical documentation for developers working on the X Growth extension.

## Architecture Overview

The extension follows Chrome Extension Manifest V3 architecture with four main components:

### 1. Content Script (`content/content.js`)
- **Runs on**: x.com pages only
- **Purpose**: Inject tweet scoring, filtering, and tooltips
- **Key Features**:
  - DOM parsing and mutation observation
  - Tweet opportunity scoring algorithm
  - Niche keyword filtering
  - Account stats tooltips
  - Reply tracking via event observation

### 2. Background Service Worker (`background/service-worker.js`)
- **Lifecycle**: Event-driven, persistent
- **Purpose**: Handle extension lifecycle and message routing
- **Key Features**:
  - Initialize default settings on install
  - Broadcast settings changes to tabs
  - Handle extension updates
  - Provide keep-alive connections

### 3. Popup Dashboard (`popup/`)
- **UI**: HTML + CSS + vanilla JavaScript
- **Purpose**: User interface for configuration and stats
- **Key Features**:
  - Reply statistics visualization
  - Niche keyword management
  - Settings toggles
  - 7-day activity chart

### 4. Storage Utilities (`utils/storage.js`)
- **Purpose**: Abstraction layer for Chrome Storage API
- **Key Features**:
  - Promise-based async/await interface
  - Keyword management helpers
  - Reply count tracking helpers

## Data Flow

```
User Action (x.com)
    ↓
Content Script (observes DOM)
    ↓
Storage API (Chrome local storage)
    ↓
Background Worker (broadcasts changes)
    ↓
All Active Tabs (update UI)
```

## Storage Schema

All data is stored in `chrome.storage.local`:

```javascript
{
  // Settings
  "enableScoring": boolean,           // Default: true
  "enableNicheFilter": boolean,       // Default: true
  "enableQuickStats": boolean,        // Default: true

  // Keywords
  "nicheKeywords": string[],          // Array of lowercase keywords

  // Reply tracking (one key per date)
  "replyCount_YYYY-MM-DD": number     // Daily reply count
}
```

## Key Algorithms

### Tweet Opportunity Score

Located in: `content/content.js` → `tweetScorer.calculateScore()`

```javascript
score = (followers × engagement_rate × reply_factor × recency_factor) / 1000

where:
  engagement_rate = (likes + retweets) / followers × 1000
  reply_factor = 1 / (replies + 1)
  recency_factor = max(0.1, 1 - (age_minutes / 1440))

result: clamped to 0-100 range
```

**Score Tiers:**
- High (🟢): score >= 10
- Medium (🟡): 3 <= score < 10
- Low (🔴): score < 3

### Follower Estimation

Since we can't easily access real follower counts from the DOM, we estimate:

```javascript
estimated_followers = total_engagement / 0.02
// Assumes average 2% engagement rate
// Clamped to 100 - 10,000,000 range
```

This is a heuristic for the MVP. Future versions could use X API or profile scraping.

## Message Passing

### From Popup → Content Script

```javascript
chrome.tabs.sendMessage(tabId, {
  type: 'SETTINGS_UPDATED',
  settings: { enableScoring: true }
});

chrome.tabs.sendMessage(tabId, {
  type: 'KEYWORDS_UPDATED',
  keywords: ['webdev', 'AI']
});
```

### From Background → Content Script

Background worker listens to storage changes and broadcasts to all x.com tabs.

## DOM Selectors

X/Twitter uses React with dynamic data-testid attributes. These are stable:

```javascript
const selectors = {
  tweet: 'article[data-testid="tweet"]',
  tweetText: '[data-testid="tweetText"]',
  likeButton: '[data-testid="like"]',
  retweetButton: '[data-testid="retweet"]',
  replyButton: '[data-testid="reply"]',
  profileImage: 'img[alt][src*="profile"]',
  replyComposer: '[data-testid="tweetTextarea_0"]'
};
```

**Note:** These may break if X changes their DOM structure. Monitor for updates.

## Performance Optimizations

### 1. Debouncing
Mutation observer is debounced to 300ms to avoid excessive processing:

```javascript
const debouncedProcess = debounce(processAllTweets, 300);
mutationObserver.observe(document.body, { /* ... */ });
```

### 2. WeakSet for Processed Tweets
Prevents reprocessing without memory leaks:

```javascript
const processedTweets = new WeakSet();
if (processedTweets.has(tweetElement)) return;
processedTweets.add(tweetElement);
```

### 3. Stats Caching
Account stats are cached in memory:

```javascript
const statsCache = new Map(); // username → stats
```

### 4. Lazy Tooltip Loading
Tooltips only created on hover with 300ms delay.

## Code Style

- **Pure Vanilla JS**: No frameworks or libraries
- **ES6+**: Modern JavaScript features
- **Promises/Async-Await**: For all async operations
- **IIFE**: Content script wrapped in immediately-invoked function
- **Comments**: JSDoc-style function documentation

## Testing

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Icons appear correctly
- [ ] Popup opens and displays correctly
- [ ] Tweet scores appear on x.com
- [ ] Score badges have correct colors
- [ ] Keywords can be added/removed
- [ ] Niche highlighting works
- [ ] Hover tooltips appear
- [ ] Reply tracking increments
- [ ] Settings toggles work
- [ ] Stats reset works
- [ ] Changes sync across tabs

### Browser Console Testing

**Content Script:**
```javascript
// Open x.com and press F12
// Check for initialization log
// Expected: "[X Growth] Extension ready!"
```

**Service Worker:**
```javascript
// Go to chrome://extensions/
// Click "Service worker" under X Growth
// Expected: "[X Growth] Service worker initialized successfully"
```

**Storage Inspection:**
```javascript
// In any context (F12)
chrome.storage.local.get(null, console.log);
```

## Debugging Tips

### Issue: Badges not appearing
1. Check if tweets are detected: `document.querySelectorAll('article[data-testid="tweet"]').length`
2. Verify content script loaded: Look for console logs
3. Check settings: `chrome.storage.local.get(['enableScoring'], console.log)`

### Issue: Keywords not filtering
1. Verify keywords stored: `chrome.storage.local.get(['nicheKeywords'], console.log)`
2. Check tweet text extraction: Inspect tweetText element
3. Verify case-insensitive matching

### Issue: Reply tracking not working
1. Check reply detection logic in click event handler
2. Verify composer has text: `document.querySelector('[data-testid="tweetTextarea_0"]').textContent`
3. Check storage: `chrome.storage.local.get(['replyCount_' + date], console.log)`

## Building for Production

### Create ZIP for Chrome Web Store

```bash
# Remove dev files
rm -rf .git .gitignore icons/*.svg icons/*.py icons/*.js icons/*.html

# Create zip
zip -r x-growth-extension.zip . -x ".*" -x "*/.*"
```

### Pre-submission Checklist

- [ ] Manifest version updated
- [ ] All console.log removed or wrapped in DEBUG flag
- [ ] README updated with new version
- [ ] CHANGELOG updated
- [ ] Icons optimized
- [ ] Privacy policy created (if needed)
- [ ] Screenshots prepared (1280x800 or 640x400)
- [ ] Store listing text prepared
- [ ] Tested on fresh Chrome profile

## Common Modifications

### Change Score Thresholds

Edit `content/content.js` → `tweetScorer.getScoreTier()`:

```javascript
getScoreTier(score) {
  if (score >= 10) return { tier: 'high', emoji: '🟢', label: 'High' };
  if (score >= 3) return { tier: 'medium', emoji: '🟡', label: 'Med' };
  return { tier: 'low', emoji: '🔴', label: 'Low' };
}
```

### Add New Settings

1. Add storage key in `background/service-worker.js` → `onInstalled`
2. Add UI in `popup/popup.html`
3. Add handling in `popup/popup.js` → `settingsManager`
4. Use in `content/content.js` → `state.settings`

### Customize Colors

Edit CSS variables in `popup/popup.css` and `content/content.css`:

```css
:root {
  --accent-blue: #1D9BF0;  /* Change to your brand color */
  --bg-primary: #15202B;    /* Change background */
}
```

## API Reference

### Chrome APIs Used

- `chrome.storage.local`: Data persistence
- `chrome.runtime.onMessage`: Message passing
- `chrome.tabs`: Tab management
- `chrome.action`: Extension icon clicks

### External Dependencies

**None!** This extension is 100% vanilla JavaScript with no external dependencies.

## Security Considerations

### Content Security Policy

Manifest V3 enforces strict CSP. Avoid:
- Inline scripts (use external .js files)
- `eval()` or `new Function()`
- Remote code execution

### XSS Prevention

All user input (keywords) is sanitized:
- Trimmed and lowercased
- No HTML rendering of user input
- Text content only, no innerHTML

### Data Privacy

- No external network requests
- No analytics or telemetry
- All data stored locally
- No PII collection

## Future Enhancements

### High Priority
- Real follower count extraction (profile scraping)
- Improved tweet age detection
- Export stats to CSV
- Configurable score formula

### Medium Priority
- Thread analysis
- Verified account filtering
- Engagement prediction ML
- Reply templates

### Low Priority
- Dark/light theme toggle
- Custom badge designs
- Multiple niche profiles
- Twitter Lists integration

## Contributing

See README.md for contribution guidelines.

## License

MIT License - See LICENSE file

---

Built with ❤️ using vanilla JavaScript
