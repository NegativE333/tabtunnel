# TabTunnel

> Send any browser tab to your phone instantly. No account. No cloud. Just a keypress.

## How it works

Press `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows/Linux) on any tab → a QR code pops up → point your phone camera at it → tab opens on your phone. Zero servers. Zero tracking. 100% local.

## Setup (Load Unpacked)

1. Download or clone this folder
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select this `tabtunnel` folder
6. Done — the TabTunnel icon will appear in your toolbar

## Adding icons

The extension needs PNG icons at 4 sizes. Place them at:

```
icons/icon16.png
icons/icon32.png
icons/icon48.png
icons/icon128.png
```

You can generate these from any PNG using a tool like [favicon.io](https://favicon.io) or just use the same image for all 4 sizes during dev.

## File structure

```
tabtunnel/
├── manifest.json       # Extension config, permissions, shortcut
├── background.js       # Service worker — reads active tab URL
├── popup.html          # Main UI
├── popup.js            # QR generation logic
├── qrcode.min.js       # Bundled QRCode library (local, no CDN)
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Keyboard shortcut

The default shortcut is `Cmd+Shift+Y` on Mac and `Ctrl+Shift+Y` on Windows/Linux.

If it conflicts with another shortcut, go to `chrome://extensions/shortcuts` to reassign it.

## Permissions used

| Permission | Why |
|---|---|
| `activeTab` | Read the URL of the current tab |
| `tabs` | Access tab title and favicon |
| `storage` | Reserved for v2 settings/history |

No network requests are made. The QR code is generated entirely in-browser.

## Publishing to Chrome Web Store

1. Delete `node_modules/` and `package*.json` from the folder
2. Zip the remaining files
3. Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Roadmap (v2 ideas)

- [ ] History: last 10 sent tabs accessible from the popup
- [ ] WebRTC pairing: push tabs to a paired phone with zero scanning
- [ ] Bulk send: select multiple tabs to send as a list
- [ ] Firefox support via WebExtensions API
