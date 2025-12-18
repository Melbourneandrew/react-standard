#!/bin/bash
# Record Playwright tests with ffmpeg (cross-platform)
# Usage: ./playwright/ffmpeg-record.sh [test-filter]
#
# Supports: macOS (AVFoundation), Linux (x11grab)
# Windows users: Use WSL or Playwright's built-in video (RECORD_VIDEO=true)

set -e

# Configuration
FPS=60

DIR="playwright/artifacts/recordings/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIR"
VIDEO="$DIR/video.mp4"
METADATA="$DIR/metadata.json"

# Detect OS and set ffmpeg input
OS="$(uname -s)"
case "$OS" in
  Darwin)
    # macOS: use AVFoundation
    SCREEN_DEVICE=$(ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep -n "Capture screen 0" | head -1 | cut -d'[' -f3 | cut -d']' -f1)
    if [ -z "$SCREEN_DEVICE" ]; then
      echo "❌ Error: Could not find screen capture device"
      exit 1
    fi
    FFMPEG_INPUT="-f avfoundation -pixel_format uyvy422 -framerate $FPS -i ${SCREEN_DEVICE}:none"
    echo "🖥️  macOS screen device: $SCREEN_DEVICE"
    ;;
  Linux)
    # Linux: use x11grab (requires X11)
    if [ -z "$DISPLAY" ]; then
      echo "❌ Error: No DISPLAY set. X11 is required for screen capture."
      exit 1
    fi
    # Get screen resolution
    RESOLUTION=$(xdpyinfo 2>/dev/null | grep dimensions | awk '{print $2}')
    if [ -z "$RESOLUTION" ]; then
      RESOLUTION="1920x1080"
      echo "⚠️  Could not detect resolution, using $RESOLUTION"
    fi
    FFMPEG_INPUT="-f x11grab -framerate $FPS -video_size $RESOLUTION -i $DISPLAY"
    echo "🖥️  Linux X11 display: $DISPLAY ($RESOLUTION)"
    ;;
  *)
    echo "❌ Error: Unsupported OS: $OS"
    echo "   Use Playwright's built-in video: RECORD_VIDEO=true pnpm test"
    exit 1
    ;;
esac

# Get test filter
if [ "$1" = "--all" ]; then
  TEST_FILTER=""
  TEST_DESC="all tests"
elif [ -n "$1" ]; then
  TEST_FILTER="$1"
  TEST_DESC="$1"
else
  TEST_FILTER="$(ls playwright/tests/*.spec.ts | head -1)"
  TEST_DESC="$TEST_FILTER"
fi

echo "📹 Recording to: $VIDEO"
echo "🎬 FPS: $FPS"
echo "🧪 Running: $TEST_DESC"
echo ""

# Build playwright command
if [ -n "$TEST_FILTER" ]; then
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test \"$TEST_FILTER\" --headed --workers=1"
else
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test --headed --workers=1"
fi

# Record timestamps
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_EPOCH=$(date +%s)

# Start ffmpeg
eval "ffmpeg $FFMPEG_INPUT -c:v libx264 -preset ultrafast -r $FPS \"$VIDEO\" -y </dev/null 2>/dev/null &"
FFPID=$!
sleep 2

# Verify ffmpeg started
if ! kill -0 $FFPID 2>/dev/null; then
  echo "❌ Error: ffmpeg failed to start"
  echo "   Check screen recording permissions"
  exit 1
fi

# Run tests
eval $PW_CMD
EXIT_CODE=$?

# Stop recording
sleep 1
kill -INT $FFPID 2>/dev/null || true
wait $FFPID 2>/dev/null || true

# Record end time
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
END_EPOCH=$(date +%s)
DURATION=$((END_EPOCH - START_EPOCH))

# Get file info
FILE_SIZE=$(ls -lh "$VIDEO" 2>/dev/null | awk '{print $5}')

# Write metadata
cat > "$METADATA" << EOF
{
  "recording": {
    "os": "$OS",
    "fps": $FPS,
    "start_time": "$START_TIME",
    "end_time": "$END_TIME",
    "duration_seconds": $DURATION
  },
  "output": {
    "video": "$(basename "$VIDEO")",
    "file_size": "$FILE_SIZE"
  },
  "test": {
    "filter": "$TEST_DESC",
    "exit_code": $EXIT_CODE
  }
}
EOF

echo ""
echo "✅ Done!"
echo "   Video: $VIDEO"
echo "   Duration: ${DURATION}s | Size: $FILE_SIZE"
exit $EXIT_CODE





