#!/bin/bash
# Record Playwright tests with screen capture
# Usage: ./playwright/record-tests.sh [test-filter]
#
# NOTE: This script is macOS-specific (uses ffmpeg with avfoundation).
# It will not work on Linux/Windows. For CI, use Playwright's built-in
# video recording via RECORD_VIDEO=true in playwright.config.ts instead.

set -e

DIR="playwright/artifacts/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIR"
VIDEO="$DIR/video.mp4"

# Get test filter (defaults to first test file, use --all for all tests)
if [ "$1" = "--all" ]; then
  TEST_FILTER=""
elif [ -n "$1" ]; then
  TEST_FILTER="$1"
else
  TEST_FILTER="$(ls playwright/tests/*.spec.ts | head -1)"
fi

echo "📹 Recording to: $VIDEO"
if [ -n "$TEST_FILTER" ]; then
  echo "🧪 Running: $TEST_FILTER"
else
  echo "🧪 Running: all tests"
fi
echo ""

# Build the playwright command
if [ -n "$TEST_FILTER" ]; then
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test \"$TEST_FILTER\" --headed --workers=1"
else
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test --headed --workers=1"
fi

# Use script command to provide a TTY for ffmpeg
# Records at 60fps for smooth playback
script -q /dev/null bash -c "
  ffmpeg -f avfoundation -framerate 60 -i 2 -c:v libx264 -preset ultrafast -pix_fmt yuv420p \"$VIDEO\" -y </dev/null >/dev/null 2>&1 &
  FFPID=\$!
  sleep 2
  $PW_CMD
  EXIT_CODE=\$?
  sleep 1
  kill -INT \$FFPID 2>/dev/null || true
  sleep 2
  exit \$EXIT_CODE
"

echo ""
echo "✅ Done! Video: $VIDEO"
