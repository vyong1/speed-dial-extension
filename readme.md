# Speed Dial New Tab

A Chrome extension that replaces the New Tab page with a customizable speed dial
collection. Dials use each site's favicon and can be added, edited, or deleted.
Added dials and the selected theme persist across Chrome restarts. The page
includes light and dark themes with a toggle in the header hamburger menu.
Speed dial names can be edited from the pencil button shown on each dial. Use
Import and Export in the same menu to back up or restore all speed dials as JSON.
Speed dial icons can be set with an image URL or an uploaded image; otherwise,
the extension uses the website favicon. Drag speed dials to reorder them.

## Load the extension in Chrome

1. Download or clone this repository to your computer.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Open a new tab to see the Speed Dial page.

To pick up local changes, click the extension's **Reload** button on
`chrome://extensions`, then open a new tab.

## Publish to the Chrome Web Store

1. Make sure the extension works when loaded unpacked.
2. Create a ZIP archive containing `manifest.json`, `newtab.html`, `styles.css`,
   and `app.js` at the archive's top level.
3. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/),
   create a new item and upload the ZIP.
4. Complete the store listing and privacy details, then submit it for review.

The Chrome Web Store requires a developer account and may require additional
listing assets or disclosures. Follow the Dashboard's current instructions.
