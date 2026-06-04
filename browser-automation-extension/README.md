# Claude Browser Automation Extension

AI-powered Chrome extension for browser automation using Claude Code. Control web pages, scrape data, inject code, manage downloads, and generate automations with natural language.

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────┐
│   Chrome Extension      │     │   Local Proxy Server  │
│                         │     │                       │
│  ┌─────────┐           │     │  Express + WebSocket  │
│  │ Popup   │ ◄────────►│◄───►│  ┌─────────────────┐ │
│  └─────────┘           │     │  │ Anthropic SDK    │ │
│  ┌─────────┐           │     │  └─────────────────┘ │
│  │Dashboard│           │     │  ┌─────────────────┐ │
│  └─────────┘           │     │  │ Claude Code CLI  │ │
│  ┌─────────┐           │     │  └─────────────────┘ │
│  │Content  │           │     └──────────────────────┘
│  │Scripts  │           │
│  └─────────┘           │
└─────────────────────────┘
```

## Features

- **AI Chat**: Describe automations in natural language
- **Web Scraping**: Extract data (JSON/CSV/text) from any page
- **Page Control**: Click, fill, scroll, navigate, screenshot
- **Code Injection**: Run custom JS/CSS on any page
- **Download Manager**: Bulk download, asset extraction
- **Claude Code Bridge**: Run Claude Code CLI from the browser
- **Automation Library**: Save and replay automation sequences
- **Context Menus**: Right-click to automate, scrape, or inspect

## Quick Start

```bash
# 1. Clone and setup
cd browser-automation-extension
bash setup.sh

# 2. Configure
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start proxy server
npm start

# 4. Load extension in Chrome
# chrome://extensions → Developer mode → Load unpacked → select extension/
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Your Claude API key |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Model for automation generation |
| `PROXY_PORT` | `3456` | Local proxy server port |
| `PROXY_HOST` | `127.0.0.1` | Proxy host |
| `CLAUDE_CODE_PATH` | auto | Path to Claude Code CLI |
| `ENABLE_REQUEST_SIGNING` | `true` | Sign requests between extension and proxy |
| `RATE_LIMIT` | `60` | Requests per minute |

## Project Structure

```
browser-automation-extension/
├── .env                    # Environment config
├── .env.example            # Config template
├── package.json            # Node dependencies
├── setup.sh                # One-click setup
├── generate-icons.js       # Icon generator
├── proxy-server/
│   ├── server.js           # Express + WS proxy server
│   └── test.js             # Connection tests
└── extension/
    ├── manifest.json       # Chrome extension manifest v3
    ├── background/
    │   └── service-worker.js
    ├── content/
    │   └── content.js      # Page injection & scraping
    ├── popup/
    │   ├── popup.html
    │   └── popup.js
    ├── dashboard/
    │   ├── dashboard.html
    │   ├── dashboard.css
    │   └── dashboard.js
    ├── options/
    │   ├── options.html
    │   └── options.js
    ├── lib/
    │   ├── api.js          # Proxy API client
    │   ├── automation.js   # Automation engine
    │   └── storage.js      # Chrome storage helpers
    └── icons/
```

## Usage Examples

**In the popup chat:**
- "Scrape all product names and prices from this page"
- "Fill the login form with test@example.com and click submit"
- "Take a screenshot every 30 seconds"
- "Download all PDF links on this page"
- "Hide all ads and popups"
- "Extract the table data as CSV"

**Via context menu:**
- Right-click any element → "Automate with Claude"
- Select text → "Scrape this element"
- Right-click → "Inspect with Claude"
