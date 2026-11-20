# Speed Dial New Tab

A Chrome extension that replaces the New Tab page with a customizable speed dial
collection. Dials can be added, edited, or deleted.
Added dials and the selected theme persist across Chrome restarts. The page
includes light, dark, blue, pink, and sepia themes, selected from the header
hamburger menu's theme dropdown.
Speed dial names can be edited from the pencil button shown on each dial. Use
Import and Export in the same menu to back up or restore all speed dials as JSON.
Use the Edit button in the header to enter edit mode. Edit mode enables dial
reordering, name editing, individual dial sizing, adding, and deleting. Select
Done to return to normal mode.
Speed dial icons can be set with an image URL or an uploaded image. Drag speed
dials to reorder them. In the edit dialog, use the logo lookup button beside the
icon URL field to search Google for the dial's logo.
Dial size can be set globally from the menu or individually in the add/edit
dialog. The global size and each dial's individual size are saved across browser
restarts.

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


## Attributions
<a href="https://www.flaticon.com/free-icons/ui" title="ui icons">Ui icons created by Adrly - Flaticon</a>