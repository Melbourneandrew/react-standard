#!/bin/bash
# Record Playwright tests with screen capture (120fps via ffmpeg)
# Usage: ./playwright/macos-record.sh [test-filter]
#
# NOTE: This script is macOS-specific (uses ffmpeg with AVFoundation).
# It will not work on Linux/Windows. For CI, use Playwright's built-in
# video recording via RECORD_VIDEO=true in playwright.config.ts instead.

set -e

# Configuration
FPS=120  # Options: 30, 60, 120 (120 may duplicate frames due to ProMotion adaptive refresh)

DIR="playwright/artifacts/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIR"
VIDEO="$DIR/video.mp4"
METADATA="$DIR/metadata.json"

# Get test filter (defaults to first test file, use --all for all tests)
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

# Get screen resolution
RESOLUTION=$(system_profiler SPDisplaysDataType 2>/dev/null | grep "Resolution:" | head -1 | sed 's/.*: //' | sed 's/ Retina//')

# Build the playwright command
if [ -n "$TEST_FILTER" ]; then
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test \"$TEST_FILTER\" --headed --workers=1"
else
  PW_CMD="DEBUG_VISUAL=true pnpm exec playwright test --headed --workers=1"
fi

# Record start time
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_EPOCH=$(date +%s)

# Start ffmpeg recording in background
ffmpeg -f avfoundation -pixel_format uyvy422 -framerate $FPS -i "2:none" \
  -c:v libx264 -preset ultrafast -r $FPS "$VIDEO" -y </dev/null 2>/dev/null &
FFPID=$!
sleep 2  # Let ffmpeg initialize

# Run tests
eval $PW_CMD
EXIT_CODE=$?

# Stop recording
sleep 1
kill -INT $FFPID 2>/dev/null || true
wait $FFPID 2>/dev/null || true

# Record end time and calculate duration
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
END_EPOCH=$(date +%s)
DURATION=$((END_EPOCH - START_EPOCH))

# Get file size
FILE_SIZE=$(ls -lh "$VIDEO" 2>/dev/null | awk '{print $5}')
FILE_SIZE_BYTES=$(stat -f%z "$VIDEO" 2>/dev/null || echo "0")

# Get actual frame count from video
FRAME_COUNT=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$VIDEO" 2>/dev/null || echo "unknown")

# Write metadata
cat > "$METADATA" << EOF
{
  "recording": {
    "backend": "ffmpeg",
    "fps_requested": $FPS,
    "resolution": "$RESOLUTION",
    "start_time": "$START_TIME",
    "end_time": "$END_TIME",
    "duration_seconds": $DURATION
  },
  "output": {
    "video": "$(basename "$VIDEO")",
    "format": "mp4",
    "codec": "h264",
    "file_size": "$FILE_SIZE",
    "file_size_bytes": $FILE_SIZE_BYTES,
    "frame_count": $FRAME_COUNT
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
echo "   Metadata: $METADATA"
echo "   Duration: ${DURATION}s | Size: $FILE_SIZE | Frames: $FRAME_COUNT"
exit $EXIT_CODE
