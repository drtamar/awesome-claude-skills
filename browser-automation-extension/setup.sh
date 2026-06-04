#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║   Claude Browser Automation - Setup          ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "  https://nodejs.org/"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# Setup .env
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Setting up environment...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    echo -e "${YELLOW}  → Edit .env to add your ANTHROPIC_API_KEY${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create work directories
WORK_DIR="${CLAUDE_WORK_DIR:-$HOME/claude-browser-sessions}"
WORK_DIR="${WORK_DIR/#\~/$HOME}"
mkdir -p "$WORK_DIR"
echo -e "${GREEN}✓ Work directory: $WORK_DIR${NC}"

DL_DIR="${DOWNLOAD_DIR:-$HOME/Downloads/claude-browser}"
DL_DIR="${DL_DIR/#\~/$HOME}"
mkdir -p "$DL_DIR"
echo -e "${GREEN}✓ Download directory: $DL_DIR${NC}"

# Generate extension icons
echo -e "\n${YELLOW}Generating extension icons...${NC}"
node generate-icons.js
echo -e "${GREEN}✓ Icons generated${NC}"

# Generate random signing secret if default
if grep -q "change-me-to-a-random-secret" .env 2>/dev/null; then
    SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')
    sed -i "s/change-me-to-a-random-secret/$SECRET/" .env
    echo -e "${GREEN}✓ Generated random signing secret${NC}"
fi

echo -e "\n${CYAN}${BOLD}═══ Setup Complete! ═══${NC}\n"
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. ${YELLOW}Edit .env${NC} and add your ANTHROPIC_API_KEY"
echo -e "  2. Start the proxy server:"
echo -e "     ${CYAN}npm start${NC}"
echo -e "  3. Load the Chrome extension:"
echo -e "     • Open ${CYAN}chrome://extensions${NC}"
echo -e "     • Enable ${YELLOW}Developer mode${NC}"
echo -e "     • Click ${YELLOW}Load unpacked${NC}"
echo -e "     • Select the ${CYAN}extension/${NC} directory"
echo -e "  4. Click the extension icon and start automating!"
echo ""
echo -e "${BOLD}Useful commands:${NC}"
echo -e "  ${CYAN}npm start${NC}     - Start proxy server"
echo -e "  ${CYAN}npm run dev${NC}   - Start with auto-reload"
echo -e "  ${CYAN}npm test${NC}      - Test proxy connection"
echo ""
