# X Growth - Chrome Extension

A powerful Chrome Extension that helps you grow your X/Twitter presence by identifying the best tweets to reply to, tracking your activity, and filtering content by niche.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### 🎯 Tweet Opportunity Scorer
- **Smart Scoring Algorithm**: Analyzes tweets based on:
  - Account follower count (higher = more visibility)
  - Current engagement (likes, retweets, replies)
  - Tweet recency (newer tweets = better opportunity)
  - Reply-to-engagement ratio (low replies + high engagement = best opportunities)
- **Color-Coded Badges**: Instantly identify high-value reply opportunities
  - 🟢 **High**: Excellent opportunity for visibility
  - 🟡 **Medium**: Good opportunity
  - 🔴 **Low**: Lower priority

### 🔍 Niche Filter
- **Keyword-Based Filtering**: Configure topics and keywords you care about
- **Visual Highlighting**: Niche-relevant tweets are highlighted with a blue accent
- **Smart Dimming**: Non-relevant tweets are automatically dimmed to reduce noise
- **Real-Time Updates**: Changes apply instantly across all open X.com tabs

### 📊 Account Quick Stats
- **Hover Tooltips**: View account statistics by hovering over profile pictures
- **Key Metrics**:
  - Follower count
  - Average engagement rate
  - Estimated reach
- **Instant Insights**: Make informed decisions about which accounts to engage with

### 📈 Reply Tracker Dashboard
- **Activity Monitoring**: Automatically tracks your reply count
- **Visual Analytics**:
  - Daily reply count
  - Weekly reply count
  - 7-day activity chart
- **Local Storage**: All data stored securely on your device
- **Reset Option**: Clear statistics anytime

## Installation

### Method 1: Load Unpacked (Development)

1. **Clone or Download** this repository
   ```bash
   git clone https://github.com/yourusername/x-growth-extension.git
   cd x-growth-extension
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `x-growth-extension` folder
   - The extension icon should appear in your toolbar

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "X Growth" and click the pin icon

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon!

## Usage

### Getting Started

1. **Navigate to X.com** (https://x.com)
   - The extension automatically activates on X/Twitter

2. **Open the Dashboard**
   - Click the X Growth icon in your toolbar
   - View your reply statistics and configure settings

3. **Configure Niche Keywords**
   - In the popup, add keywords related to your interests
   - Examples: "webdev", "AI", "startup", "design"
   - Press Enter or click + to add keywords
   - Click × on any keyword to remove it

4. **Browse Your Feed**
   - Opportunity scores appear on each tweet
   - Niche-relevant tweets are highlighted in blue
   - Hover over profile pictures for quick stats

### Settings

The popup dashboard includes three toggleable settings:

- ✅ **Show opportunity scores on tweets**: Display color-coded badges
- ✅ **Highlight niche-relevant tweets**: Apply visual filtering
- ✅ **Show account stats on hover**: Enable quick stats tooltips

All settings sync instantly across open tabs.

### Understanding Opportunity Scores

The scoring algorithm evaluates reply opportunities using this formula:

```
score = (followers × engagement_rate × reply_factor × recency_factor) / 1000
```

Where:
- **followers**: Account's follower count (or estimated from engagement)
- **engagement_rate**: (likes + retweets) per 1000 followers
- **reply_factor**: 1 / (replies + 1) - lower replies = better
- **recency_factor**: Decay over 24 hours - newer is better

**Score Tiers:**
- 🟢 **High** (10+): Prime opportunity, high visibility potential
- 🟡 **Medium** (3-10): Good opportunity, decent visibility
- 🔴 **Low** (<3): Lower priority, less visibility potential

### Best Practices

1. **Focus on High Scores**: Prioritize 🟢 high-opportunity tweets
2. **Add Value**: Reply with thoughtful, relevant content
3. **Be Consistent**: Track your daily/weekly reply goals
4. **Use Niche Filtering**: Stay focused on relevant conversations
5. **Check Account Stats**: Engage with accounts in your target audience range

## Project Structure

```
x-growth-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup/                 # Dashboard UI
│   ├── popup.html        # Dashboard layout
│   ├── popup.css         # Styling (X-themed dark mode)
│   └── popup.js          # Dashboard logic
├── content/              # Content scripts (injected into x.com)
│   ├── content.js        # Main content script
│   └── content.css       # Tweet overlay styles
├── background/
│   └── service-worker.js # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png        # 16x16 toolbar icon
│   ├── icon48.png        # 48x48 extension management
│   ├── icon128.png       # 128x128 Chrome Web Store
│   ├── generate-png.py   # Icon generator script
│   └── generate-icons.html # Browser-based icon generator
├── utils/
│   └── storage.js        # Chrome Storage API helpers
└── README.md             # This file
```

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome Extension manifest version
- **No External Dependencies**: Pure vanilla JavaScript, CSS, and HTML
- **No API Calls**: All data parsed directly from the DOM
- **Local Storage Only**: Chrome Storage API for all data persistence
- **MutationObserver**: Handles X's dynamic content loading
- **Event-Driven**: Efficient message passing between components

### Browser Compatibility

- ✅ Chrome 88+ (Manifest V3 support)
- ✅ Edge 88+ (Chromium-based)
- ✅ Brave (Chromium-based)
- ✅ Opera (Chromium-based)

### Privacy

- **No Data Collection**: Nothing is sent to external servers
- **Local Storage Only**: All data stays on your device
- **No Tracking**: No analytics or telemetry
- **No Permissions Abuse**: Only requests necessary permissions
- **Open Source**: Full transparency, audit the code yourself

### Performance

- **Lightweight**: <100KB total size
- **Efficient DOM Parsing**: Debounced mutation observation
- **Minimal CPU Usage**: Smart caching and lazy evaluation
- **No Memory Leaks**: Proper cleanup and WeakSet usage

## Development

### Modifying the Code

1. **Make your changes** to the source files

2. **Reload the extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on the X Growth extension
   - Or disable and re-enable the extension

3. **Test on X.com**
   - Refresh any open X.com tabs
   - Verify your changes work as expected

### Generating New Icons

If you want to customize the icons:

**Option 1: Python Script**
```bash
cd icons/
python3 generate-png.py
```

**Option 2: Browser-Based**
```bash
# Open icons/generate-icons.html in a browser
# Click "Download All Icons"
# Save to icons/ folder
```

### Debugging

**View Console Logs:**
- Content Script: Open DevTools on x.com (F12) → Console
- Service Worker: Go to `chrome://extensions/` → X Growth → Service Worker → Inspect
- Popup: Right-click extension icon → Inspect popup

**Common Issues:**
- **Extension not loading**: Check manifest.json syntax
- **Content script not running**: Verify x.com is in host_permissions
- **Storage not working**: Check Chrome Storage API permissions
- **Badges not appearing**: Inspect tweet DOM structure changes

## Roadmap

Future enhancements planned:

- [ ] Advanced filters (follower range, verified accounts)
- [ ] Engagement prediction ML model
- [ ] Export reply statistics to CSV
- [ ] Reply templates and quick responses
- [ ] Twitter Lists integration
- [ ] Thread analysis and scoring
- [ ] A/B testing for reply timing
- [ ] Chrome Web Store publication

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Extension doesn't appear on X.com
- Verify you're on `https://x.com/*` (not `twitter.com`)
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page (Ctrl+R or Cmd+R)

### Scores aren't showing
- Ensure "Show opportunity scores" is enabled in settings
- Check that tweets are fully loaded (scroll to trigger)
- Some tweet types (ads, promoted) may not be scored

### Reply tracker not updating
- Replies are tracked when you click the tweet button
- Check popup dashboard to verify count
- Try resetting stats if counter seems stuck

### Keywords not highlighting tweets
- Ensure "Highlight niche-relevant tweets" is enabled
- Keywords are case-insensitive
- Must match text in tweet body (not usernames/hashtags alone)

## License

MIT License - see LICENSE file for details

## Disclaimer

This extension is not affiliated with, endorsed by, or sponsored by X Corp (Twitter). Use at your own risk. The developers are not responsible for any consequences of using this tool.

## Support

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Open an issue with the "enhancement" label
- 📧 **Contact**: [your-email@example.com]

## Changelog

### v1.0.0 (2024-01-28)
- 🎉 Initial release
- ✨ Tweet opportunity scoring
- 🔍 Niche keyword filtering
- 📊 Account quick stats tooltips
- 📈 Reply tracker dashboard
- 🎨 X-themed dark mode UI

---

Made with ❤️ for the X/Twitter community
