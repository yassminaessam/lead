#!/bin/zsh
# ═══════════════════════════════════════════════════════════
#  Mobarez LeadEngine — One-Click Launcher
#  Double-click to start MongoDB + Backend + Frontend + Metro
#  Close this window or press Ctrl+C to stop everything
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
MOBILE_DIR="$(cd "$SCRIPT_DIR/../Mobarez Android Remote Call Proxy/mobile" 2>/dev/null && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BACKEND_PID=""
FRONTEND_PID=""
METRO_PID=""

cleanup() {
    echo ""
    echo "${YELLOW}═══════════════════════════════════════${NC}"
    echo "${YELLOW}  Shutting down LeadEngine...${NC}"
    echo "${YELLOW}═══════════════════════════════════════${NC}"

    # Kill backend
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "${RED}  Stopping backend (PID $BACKEND_PID)...${NC}"
        kill "$BACKEND_PID" 2>/dev/null
        wait "$BACKEND_PID" 2>/dev/null
    fi

    # Kill frontend
    if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "${RED}  Stopping frontend (PID $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null
        wait "$FRONTEND_PID" 2>/dev/null
    fi

    # Kill Metro
    if [[ -n "$METRO_PID" ]] && kill -0 "$METRO_PID" 2>/dev/null; then
        echo "${RED}  Stopping Metro (PID $METRO_PID)...${NC}"
        kill "$METRO_PID" 2>/dev/null
        wait "$METRO_PID" 2>/dev/null
    fi

    # Kill anything left on our ports
    lsof -ti :5001 | xargs kill -9 2>/dev/null
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    lsof -ti :8081 | xargs kill -9 2>/dev/null

    echo "${GREEN}  All services stopped. Goodbye!${NC}"
    exit 0
}

# Trap signals so cleanup runs when window is closed or Ctrl+C is pressed
trap cleanup INT TERM HUP EXIT

clear
echo "${CYAN}═══════════════════════════════════════════════════${NC}"
echo "${CYAN}       Mobarez LeadEngine — Starting Up${NC}"
echo "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

# ── 1. MongoDB Atlas (Cloud) ──
echo "${YELLOW}[1/5]${NC} Using MongoDB Atlas (cloud database)..."
echo "${GREEN}  ✓ Cloud database configured — no local MongoDB needed${NC}"

# ── 2. Start Backend Server ──
echo "${YELLOW}[2/5]${NC} Starting backend server..."
# Kill anything on port 5001 first
lsof -ti :5001 | xargs kill -9 2>/dev/null
cd "$SERVER_DIR"
npm run dev &
BACKEND_PID=$!
sleep 2

if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "${GREEN}  ✓ Backend running on http://localhost:5001${NC}"
    echo "${GREEN}  ✓ WebRTC signaling server ready${NC}"
else
    echo "${RED}  ✗ Backend failed to start${NC}"
fi

# ── 3. Start Frontend Dev Server ──
echo "${YELLOW}[3/5]${NC} Starting frontend..."
# Kill anything on port 5173 first
lsof -ti :5173 | xargs kill -9 2>/dev/null
cd "$SCRIPT_DIR"
npm run dev &
FRONTEND_PID=$!
sleep 2

if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "${GREEN}  ✓ Frontend running on http://localhost:5173${NC}"
else
    echo "${RED}  ✗ Frontend failed to start${NC}"
fi

# ── 4. ADB Reverse/Forward Port Forwarding ──
echo "${YELLOW}[4/5]${NC} Setting up ADB port forwarding..."
if command -v adb &>/dev/null && adb devices 2>/dev/null | grep -q 'device$'; then
    adb reverse tcp:8081 tcp:8081 2>/dev/null
    adb reverse tcp:5001 tcp:5001 2>/dev/null
    adb forward tcp:8080 tcp:8080 2>/dev/null
    echo "${GREEN}  ✓ ADB reverse: tcp:8081 + tcp:5001 (device→Mac)${NC}"
    echo "${GREEN}  ✓ ADB forward: tcp:8080 (Mac→device HTTP server)${NC}"
else
    echo "${YELLOW}  ⚠ No Android device connected, skipping ADB port forwarding${NC}"
fi

# ── 5. Start Metro Bundler ──
echo "${YELLOW}[5/5]${NC} Starting Metro bundler..."
lsof -ti :8081 | xargs kill -9 2>/dev/null
if [[ -n "$MOBILE_DIR" ]] && [[ -d "$MOBILE_DIR" ]]; then
    cd "$MOBILE_DIR"
    npx react-native start --reset-cache &
    METRO_PID=$!
    sleep 3
    if kill -0 "$METRO_PID" 2>/dev/null; then
        echo "${GREEN}  ✓ Metro running on http://localhost:8081${NC}"
    else
        echo "${RED}  ✗ Metro failed to start${NC}"
    fi
else
    echo "${RED}  ✗ Mobile project not found at expected path${NC}"
fi

echo ""
echo "${CYAN}═══════════════════════════════════════════════════${NC}"
echo "${GREEN}  ✓ LeadEngine is ready!${NC}"
echo "${CYAN}  Open: ${NC}${GREEN}http://localhost:5173${NC}"
echo "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "${YELLOW}  Close this window or press Ctrl+C to stop all services${NC}"
echo ""

# Open in browser
open "http://localhost:5173" 2>/dev/null

# Wait for child processes — keeps the script alive
wait
