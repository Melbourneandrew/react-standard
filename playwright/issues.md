# Known Issues

Tracking known problems with the Playwright testing infrastructure.

---

## Recording Scripts

### `macos-record.sh` — Visual Artifacts

**Status:** Broken (semi-workable)

**Symptoms:**
- Visual artifacts appear in recorded video
- May be related to external monitor usage

**Potential causes:**
- Display scaling issues with multiple monitors
- AVFoundation capturing wrong display
- Screen device detection picking up the wrong monitor

**To investigate:**
- Check `SCREEN_DEVICE` detection when external monitor is connected
- Try forcing a specific display index
- Test with only built-in display

---

### `ffmpeg-record.sh` — Not Capturing

**Status:** Broken

**Symptoms:**
- Recording doesn't capture properly
- Script runs but output is empty or incorrect

**Potential causes:**
- Same display detection issues as macos-record.sh
- x11grab path not tested on macOS (uses AVFoundation path)

**To investigate:**
- Verify ffmpeg input parameters are correct
- Check if the script works on Linux with x11grab
- May need platform-specific debugging

---

## Notes

- Both scripts use `FPS=60` which should be stable
- The `RECORD_VIDEO=true` Playwright built-in recording is an alternative that should work cross-platform
- External monitor setups may need manual display index configuration
