# Installation Guide - X Growth Extension

Quick guide to install and start using the X Growth extension.

## Prerequisites

- Google Chrome (version 88 or higher)
- Or any Chromium-based browser (Edge, Brave, Opera)

## Installation Steps

### Step 1: Download the Extension

**Option A: Clone with Git**
```bash
git clone https://github.com/yourusername/x-growth-extension.git
cd x-growth-extension
```

**Option B: Download ZIP**
1. Download the ZIP file from the repository
2. Extract to a folder (e.g., `x-growth-extension`)

### Step 2: Open Chrome Extensions

1. Open Google Chrome
2. Navigate to: `chrome://extensions/`
   - Or use menu: ⋮ → More Tools → Extensions
3. You should see the Extensions management page

### Step 3: Enable Developer Mode

1. Look for "Developer mode" toggle in the top-right corner
2. Click to enable it (should turn blue)
3. New buttons will appear: "Load unpacked", "Pack extension", "Update"

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button
2. Browse to the `x-growth-extension` folder
3. Select the folder and click **"Select Folder"** (or "Open")
4. The extension should now appear in your extensions list

### Step 5: Verify Installation

You should see:
- ✅ Extension card titled "X Growth"
- ✅ Version 1.0.0
- ✅ Status: "On" (blue toggle)
- ✅ Icon: Blue growth arrow chart

### Step 6: Pin the Extension (Recommended)

1. Click the puzzle piece icon (🧩) in Chrome toolbar
2. Find "X Growth" in the list
3. Click the pin icon (📌) next to it
4. The extension icon will now appear in your toolbar

### Step 7: Start Using

1. Navigate to https://x.com
2. Log in to your X/Twitter account
3. The extension will automatically start working:
   - Opportunity scores appear on tweets
   - Click the extension icon to open the dashboard
   - Configure your niche keywords
   - Start engaging with high-opportunity tweets!

## First-Time Setup

### Configure Niche Keywords

1. Click the X Growth icon in your toolbar
2. Scroll to "Niche Keywords" section
3. Type a keyword (e.g., "webdev", "AI", "startup")
4. Press Enter or click the + button
5. Repeat for multiple keywords (up to 20)
6. Keywords will highlight relevant tweets on your feed

### Adjust Settings

In the popup dashboard, you can toggle:

- **Show opportunity scores**: Display color-coded badges on tweets
- **Highlight niche-relevant tweets**: Apply blue highlighting
- **Show account stats on hover**: Enable profile hover tooltips

All settings apply instantly!

## Troubleshooting

### Extension doesn't load
- Check that you selected the correct folder (should contain manifest.json)
- Look for error messages in the extension card
- Verify Developer mode is enabled

### Icon not showing
- Make sure PNG icons exist in `icons/` folder
- Run `cd icons && python3 generate-png.py` to regenerate icons
- Reload the extension after generating icons

### Not working on X.com
- Verify you're on `https://x.com/*` (not `twitter.com`)
- Refresh the page (Ctrl+R or Cmd+R)
- Check extension is enabled and has a green "On" toggle
- Open DevTools (F12) and check Console for errors

### Features not appearing
- Wait a few seconds for tweets to load
- Scroll down to trigger content observation
- Check popup settings are enabled
- Try disabling/re-enabling the extension

## Updating the Extension

When you make changes to the code:

1. Go to `chrome://extensions/`
2. Find "X Growth" extension
3. Click the refresh/reload icon (🔄)
4. Refresh any open X.com tabs

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "X Growth" extension
3. Click "Remove"
4. Confirm the removal
5. All local data will be deleted

## Need Help?

- 📖 Read the full README.md for detailed documentation
- 🐛 Report bugs on GitHub Issues
- 💬 Check the Troubleshooting section in README.md

---

Happy growing! 🚀
