# 🎬 Google Meet Recorder

> A powerful Chrome extension to record Google Meet meetings with high-quality video and audio capture.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://chrome.google.com/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](package.json)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](#)

---

## ✨ Features

- 🎥 **High-Quality Video Recording** - Up to 1080p @ 30fps with 8 Mbps bitrate
- 🔊 **Crystal Clear Audio** - 256 kbps professional-grade audio mixing
- 🎤 **Multi-Source Audio** - Captures both microphone and system audio (Google Meet participants)
- 📹 **Screen Capture** - Full screen recording with cursor visibility
- ⏱️ **Easy Controls** - Simple one-click START/STOP/PAUSE interface
- 💾 **Auto-Save** - Automatically saves recordings to Downloads folder
- 🎨 **Beautiful UI** - Modern gradient design with Material Icons
- 📱 **Responsive Design** - Works on all screen sizes
- ⚡ **Fast & Lightweight** - Minimal performance impact on your system

---

## 🚀 Quick Start

### Installation

1. **Clone or Download** this repository
   ```bash
   git clone https://github.com/NirmaLKumar26/google-meet-recorder.git
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top-right corner)

3. **Load Unpacked Extension**
   - Click **"Load unpacked"**
   - Select the `G-Meet_ExT` folder
   - Extension will be installed immediately!

### Usage

1. **Open Google Meet** in Chrome
2. **Click the extension icon** in your toolbar
3. **Click START** to begin recording
4. **Allow permissions** when prompted:
   - Screen capture (select your window)
   - Microphone access
   - ✅ **Check "Share system audio"** for best results
5. **Click STOP** when finished
6. **Click SAVE** to download the recording
7. **Find your recording** in `Downloads` folder as `.webm` file

### Playing Recordings

- **VLC Media Player** (recommended) - [Download](https://www.videolan.org/)
- **Windows Media Player**
- **Chrome Browser** (drag and drop)
- **Any WebM-compatible player**

---

## 📋 System Requirements

- ✅ **Browser**: Google Chrome v90+
- ✅ **OS**: Windows, macOS, or Linux
- ✅ **Permissions Needed**:
  - Screen capture access
  - Microphone access
  - Storage for recordings
  - Google Meet website access

---

## 🎯 What You Can Record

✅ Google Meet video conferences
✅ Screen presentations
✅ Multiple participant conversations
✅ Audio from all participants + your microphone
✅ Shared screens and documents
✅ Cursor movements

---

## 📁 Project Structure

```
G-Meet_ExT/
├── manifest.json              # Chrome extension configuration
├── package.json               # Project metadata
├── README.md                  # Documentation (this file)
│
├── src/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic and event handlers
│   ├── popup.css             # Modern gradient styling
│   ├── content.js            # Recording engine (injected into Google Meet)
│   ├── background.js         # Service worker for background tasks
│   │
│   └── images/
│       ├── icon-16.png       # Toolbar icon (small)
│       ├── icon-48.png       # Toolbar icon (medium)
│       └── icon-128.png      # Chrome Web Store icon
│
└── client_secret_*.json       # OAuth2 credentials (git ignored)
```

---

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Google Meet Page (meet.google.com)              │
├─────────────────────────────────────────────────────────┤
│  Content Script (content.js)                            │
│  • Captures screen via getDisplayMedia()                │
│  • Captures audio via getUserMedia()                    │
│  • Mixes audio streams using Web Audio API              │
│  • Records via MediaRecorder API                        │
└──────────────────┬──────────────────────────────────────┘
                   │ (chrome.runtime.sendMessage)
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Extension Popup (popup.html/js/css)             │
├─────────────────────────────────────────────────────────┤
│  • START/STOP/PAUSE button UI                           │
│  • Recording status display                             │
│  • Download button                                      │
│  • Material Design Icons                                │
└──────────────────┬──────────────────────────────────────┘
                   │ (chrome.runtime.sendMessage)
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Background Service Worker (background.js)       │
├─────────────────────────────────────────────────────────┤
│  • Message routing                                      │
│  • Badge updates                                        │
│  • Background processing                                │
└─────────────────────────────────────────────────────────┘
```

### Recording Specifications

| Feature | Specification |
|---------|---------------|
| **Video Codec** | VP9 (WebM container) |
| **Video Bitrate** | 8 Mbps (high quality) |
| **Video Resolution** | Up to 1920×1080 (1080p) |
| **Frame Rate** | 30 fps |
| **Audio Codec** | Opus (WebM container) |
| **Audio Bitrate** | 256 kbps (professional) |
| **Sample Rate** | 48 kHz |
| **File Format** | .webm (open standard) |
| **Estimated Size** | ~100-200 MB per minute |

---

## 🛠️ Technologies Used

### APIs & Libraries
- **Chrome Extension APIs**
  - `chrome.tabs` - Tab management
  - `chrome.runtime` - Message passing
  - `chrome.downloads` - File downloads
  - `chrome.storage` - Local storage

- **Web APIs**
  - `MediaRecorder API` - Video/audio recording
  - `getDisplayMedia()` - Screen capture
  - `getUserMedia()` - Microphone access
  - `Web Audio API` - Audio mixing
  - `Blob & URL` - File handling

- **Frontend**
  - HTML5
  - CSS3 (Gradients, Animations)
  - JavaScript (ES6+)
  - Material Icons (Google Fonts)

---

## 🎨 UI Features

### Button Controls
- **START** - Begins recording (green button, record icon)
- **PAUSE** - Pauses recording (orange button, pause icon)
- **STOP** - Stops recording (red button, stop icon)
- **SAVE** - Downloads the recording (purple button, download icon)

### Visual Design
- 🎨 Modern gradient background
- ✨ Smooth hover animations
- 📊 Recording status indicator
- 🎭 Material Design icons
- 🌙 Clean, professional interface

---

## ⚙️ Permissions Explained

The extension requests these permissions:

| Permission | Why | Security |
|------------|-----|----------|
| `activeTab` | To work with current tab | Active tab only |
| `scripting` | To inject recording logic | meet.google.com only |
| `downloads` | To save recordings | User initiated only |
| `tabCapture` | To capture screen/audio | User consent required |
| `storage` | To store settings | Local device only |

**No data is sent to external servers.** All recordings are processed locally on your device.

---

## 📝 How Recording Works

### Step-by-Step Process

1. **User clicks START** button in extension popup
2. **Browser requests permissions:**
   - Select window/screen to share
   - Confirm microphone access
   - Option to share system audio
3. **Extension captures:**
   - Screen video stream (VP9 codec)
   - Microphone audio stream
   - System audio stream (optional)
4. **Audio mixing:**
   - Microphone audio → Gain node (1.2x boost)
   - System audio → Gain node (1.0x)
   - Both → Dynamic compressor
   - Output → MediaRecorder
5. **Recording continues** until user clicks STOP
6. **On STOP:**
   - All streams are stopped
   - Audio context is suspended
   - Data chunks are collected
7. **On SAVE:**
   - Blob created from all chunks
   - WebM file generated
   - Automatically downloaded to Downloads folder

---

## 🐛 Troubleshooting

### Issue: "Content script not ready yet"
**Solution:**
- Refresh the Google Meet page
- Wait 3-4 seconds after page loads
- Try clicking START again

### Issue: "No system audio captured"
**Solution:**
- Make sure to **check "Share system audio"** in permission dialog
- Some systems require explicit system audio permission
- Try using VLC to verify audio tracks in recording

### Issue: "Recording is laggy"
**Solution:**
- Close other Chrome tabs/extensions
- Ensure sufficient disk space
- Check internet connection speed
- Restart Chrome if needed

### Issue: "Microphone not working"
**Solution:**
- Check Chrome permissions: Settings → Privacy → Microphone
- Test microphone in system settings
- Reload extension and try again
- Grant microphone permission when prompted

### Issue: "File won't play in media player"
**Solution:**
- Use VLC Media Player (best compatibility)
- Ensure recording completed fully (check file size)
- Wait 10+ seconds before playing
- Try opening in Chrome browser directly

---

## 💡 Tips & Best Practices

✅ **Before Recording:**
- Close unnecessary tabs
- Test microphone and speakers
- Ensure good internet connection
- Have enough free disk space (100+ MB)

✅ **During Recording:**
- Avoid alt-tabbing (can freeze screen capture)
- Keep Google Meet window visible
- Speak clearly into microphone
- Check that participants are visible

✅ **After Recording:**
- Wait 5-10 seconds before opening file
- Check file size (should be 100+MB for 1 minute)
- Test audio/video playback
- Store important recordings safely

---

## 📜 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👨‍💻 Developed By

**Nirmal**

- GitHub: [@yourprofile](https://github.com/)
- Email: [your.email@example.com](mailto:your.email@example.com)
- Website: [your-website.com](https://your-website.com)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📞 Support & Feedback

- 📧 **Email**: [support@example.com](mailto:support@example.com)
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💬 **Feature Requests**: Discussions tab on GitHub
- 🌟 **Star** this repo if you find it helpful!

---

## 🔐 Privacy & Security

- ✅ **No data collection** - Everything stays on your device
- ✅ **No cloud upload** - Recordings save locally only
- ✅ **No tracking** - No analytics or telemetry
- ✅ **Open source** - Code is transparent and auditable
- ✅ **Local processing** - All encoding done in browser

---

## 📊 Version History

### v1.0.0 (Current)
- ✅ Initial release
- ✅ High-quality video recording (8 Mbps)
- ✅ Professional audio mixing (256 kbps)
- ✅ Material Design UI
- ✅ One-click recording
- ✅ Auto-download feature

---

## 🙏 Acknowledgments

- **Google Meet** for the platform
- **Chrome Extension APIs** for powerful capabilities
- **Material Design** for beautiful icons
- **WebCodecs & MediaRecorder** for recording technology
- **Open Source Community** for inspiration

---

## 📞 Get in Touch

### Contact & Links

- 🌐 **Website:** [nirmal.tndev.in](https://nirmal.tndev.in)
- 📧 **Email:** [nirmal@tndev.in](mailto:nirmal@tndev.in)
- 💻 **GitHub:** [NirmaLKumar26/google-meet-recorder](https://github.com/NirmaLKumar26/google-meet-recorder)

---

## ⭐ Show Your Support

If you find this extension useful, please:
- ⭐ **Star** this repository
- 📢 **Share** with others
- 💬 **Leave feedback** in issues
- 🐞 **Report bugs** you find
- 🎁 **Contribute** improvements

---

<div align="center">

### Made with ❤️ by Nirmal

**Happy Recording! 🎬**

[⬆ Back to Top](#google-meet-recorder)

</div>
